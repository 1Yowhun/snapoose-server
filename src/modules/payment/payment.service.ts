import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isUUID } from 'class-validator';
import { AppLogger } from '../../common/logger.service.js';
import { PaymentRepository, PaymentResponse } from './payment.repository.js';
import { PaymentDto } from '../../dto/payment.dto.js';
import { RequestDevice } from '../../entity/requestUser.entity.js';
import { Payment } from '../../shared/infra/database/schema/payment.schema.js';
import {
  MidtransClient,
  MidtransNotification,
  MidtransResponse,
} from '../../shared/infra/midtrans/midtrans.client.js';

type PaymentRef = Pick<Payment, 'id' | 'midtransOrderId' | 'totalAmount'>;

@Injectable()
export class PaymentService {
  constructor(
    private readonly logger: AppLogger,
    private readonly paymentRepository: PaymentRepository,
    private readonly midtrans: MidtransClient,
  ) {}

  async createPayment(
    device: RequestDevice,
    idempotencyKey: string,
    dto: PaymentDto,
  ) {
    if (!idempotencyKey || !isUUID(idempotencyKey))
      throw new BadRequestException('Idempotency-Key must be a valid UUID');

    const { tenantId, boothId } = device;

    // 1. Request yang sama dikirim ulang → kembalikan payment lama
    const existing = await this.paymentRepository.findByIdempotencyKey(
      tenantId,
      idempotencyKey,
      boothId,
    );
    if (existing) return this.replay(existing, dto);

    const [frame, product, voucher] = await Promise.all([
      this.paymentRepository.findFrame(tenantId, boothId, dto.frameId),
      this.paymentRepository.findProduct(tenantId, boothId, dto.productId),
      dto.voucherId
        ? this.paymentRepository.findVoucher(tenantId, boothId, dto.voucherId)
        : null,
    ]);
    if (!product)
      throw new NotFoundException('Product is not available at this booth');
    if (!frame)
      throw new NotFoundException('Frame is not available at this booth');
    if (dto.voucherId && !voucher)
      throw new NotFoundException(
        'Voucher is not available, expired, or out of quota',
      );

    let payment: PaymentResponse | null;
    try {
      payment = await this.paymentRepository.createPending(
        {
          midtransOrderId: randomUUID(),
          tenantId,
          boothId,
          product_id: product.id,
          frameId: frame.id,
          voucherId: voucher?.id ?? null,
          idempotencyKey,
        },
        Math.round(Number(product.price)),
      );
    } catch (e: any) {
      // Dua request dengan key sama masuk bersamaan; yang kalah ambil hasil yang menang
      if ((e.cause ?? e).code === '23505') {
        const winner = await this.paymentRepository.findByIdempotencyKey(
          device.tenantId,
          idempotencyKey,
          boothId,
        );
        if (winner) return this.replay(winner, dto);
      }
      throw e;
    }
    if (!payment) throw new ConflictException('Voucher is no longer available');

    this.logger.log(
      `Payment created: paymentId=${payment.id} tenantId=${tenantId} boothId=${boothId} total=${payment.totalAmount}`,
      PaymentService.name,
    );

    if (Number(payment.totalAmount) === 0) return payment;

    return this.ensureQrReady(await this.chargeAndSaveQr(payment));
  }

  async handleNotification(notification: MidtransNotification) {
    if (
      !notification ||
      typeof notification.order_id !== 'string' ||
      !notification.order_id ||
      typeof notification.status_code !== 'string' ||
      typeof notification.gross_amount !== 'string' ||
      typeof notification.signature_key !== 'string'
    ) {
      throw new BadRequestException('Invalid notification payload');
    }

    const signatureValid = this.midtrans.verifySignature(notification);

    if (!signatureValid) {
      throw new UnauthorizedException('Invalid Midtrans signature');
    }
    const payment = await this.paymentRepository.findByMidtransOrderId(
      notification.order_id,
    );
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    let status: MidtransResponse;

    try {
      status = await this.midtrans.getStatus(payment.midtransOrderId);
    } catch {
      // Jangan membalas sukses jika status belum dapat diverifikasi.
      throw new ServiceUnavailableException('Unable to verify payment status');
    }

    if (
      status.order_id !== payment.midtransOrderId ||
      status.gross_amount == null ||
      payment.totalAmount == null
    ) {
      throw new ServiceUnavailableException(
        'Incomplete or inconsistent payment status',
      );
    }
    const providerAmount = Number(status.gross_amount);
    const expectedAmount = Number(payment.totalAmount);

    if (
      !Number.isFinite(providerAmount) ||
      !Number.isFinite(expectedAmount) ||
      providerAmount !== expectedAmount
    ) {
      throw new BadRequestException('Payment amount mismatch');
    }

    switch (status.transaction_status) {
      case 'settlement':
        await this.paymentRepository.markPaid(payment.id);
        break;

      case 'expire':
        await this.paymentRepository.markFailed(payment.id, 'EXPIRED');
        break;

      case 'cancel':
      case 'deny':
        await this.paymentRepository.markFailed(payment.id, 'FAILED');
        break;

      case 'pending':
        break;

      default:
        throw new ServiceUnavailableException(
          'Payment status is not handled yet',
        );
    }
  }

  async getStatusMidtrans(paymentId: string, device: RequestDevice) {
    const payment = await this.paymentRepository.findForDevice(
      paymentId,
      device.tenantId,
      device.boothId,
    );
    if (!payment) throw new NotFoundException('Payment not found');

    // Status final atau gratis → jawab dari DB, tidak perlu ke Midtrans
    if (
      payment.paymentStatus !== 'PENDING' ||
      Number(payment.totalAmount) === 0
    ) {
      return payment;
    }

    try {
      const status = await this.midtrans.getStatus(payment.midtransOrderId);

      // 404: charge belum ada; GET tidak membuat charge, FE retry POST
      if (status.status_code !== '404' && status.transaction_status) {
        await this.applyProviderStatus(payment, status);
      }
    } catch (e) {
      // Midtrans error ≠ gagal bayar; kembalikan status DB, FE poll lagi
      this.logger.logError(
        `Midtrans status check failed: paymentId=${payment.id}`,
        e,
        PaymentService.name,
      );
    }

    // Baca ulang: status bisa berubah oleh langkah di atas atau oleh webhook
    return (
      (await this.paymentRepository.findForDevice(
        paymentId,
        device.tenantId,
        device.boothId,
      )) ?? payment
    );
  }

  private async replay(existing: Payment, dto: PaymentDto) {
    const same =
      existing.product_id === dto.productId &&
      existing.frameId === dto.frameId &&
      existing.voucherId === (dto.voucherId ?? null) &&
      (!dto.boothId || existing.boothId === dto.boothId);
    if (!same)
      throw new ConflictException(
        'Idempotency-Key was already used with different data',
      );

    this.logger.log(
      `Idempotency hit: paymentId=${existing.id}`,
      PaymentService.name,
    );
    return this.ensureQrReady(await this.recoverPayment(existing.id));
  }

  private async recoverPayment(paymentId: string): Promise<PaymentResponse> {
    // Baca ulang karena request pertama mungkin sudah menyimpan QR/status.
    const current = await this.findPaymentOrThrow(paymentId);
    if (
      current.paymentStatus !== 'PENDING' ||
      current.qrString ||
      Number(current.totalAmount) === 0
    ) {
      return current;
    }

    let status: MidtransResponse;
    try {
      status = await this.midtrans.getStatus(current.midtransOrderId);
    } catch {
      // Timeout bukan bukti transaksi gagal; client boleh retry.
      this.logger.warn(
        `Midtrans status unavailable: paymentId=${current.id}`,
        PaymentService.name,
      );
      return current;
    }

    // Charge tidak pernah sampai ke Midtrans (mis. server mati sebelum charge).
    // Aman dikirim ulang: order_id yang sama tidak bisa menjadi dua transaksi.
    if (status.status_code === '404') {
      this.logger.warn(
        `Charge missing at Midtrans, retrying: paymentId=${current.id}`,
        PaymentService.name,
      );
      return this.chargeAndSaveQr(current);
    }

    if (!status.transaction_status) return current;

    await this.applyProviderStatus(current, status);

    // Transaksi ada dan masih pending, tapi QR belum tersimpan di DB
    if (status.transaction_status === 'pending') {
      await this.saveQrFrom(current.id, status);
    }

    return this.findPaymentOrThrow(current.id);
  }

  private ensureQrReady(payment: PaymentResponse) {
    if (payment.paymentStatus === 'PENDING' && !payment.qrString) {
      throw new ServiceUnavailableException(
        'Payment QR is not ready yet; retry with the same Idempotency-Key',
      );
    }
    return payment;
  }

  private async findPaymentOrThrow(id: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async chargeAndSaveQr(payment: PaymentRef): Promise<PaymentResponse> {
    let res: MidtransResponse;
    try {
      res = await this.midtrans.chargeQris(
        payment.midtransOrderId,
        Number(payment.totalAmount),
      );
    } catch {
      // Charge mungkin sudah sampai; retry berikutnya akan cek lewat getStatus
      this.logger.warn(
        `Midtrans charge unavailable: paymentId=${payment.id}`,
        PaymentService.name,
      );
      return this.findPaymentOrThrow(payment.id);
    }

    const code = String(res.status_code ?? '');

    if (code === '201') {
      await this.saveQrFrom(payment.id, res);
    } else if (code === '406') {
      // order_id sudah ada di Midtrans: charge sebelumnya ternyata sempat masuk
      this.logger.warn(
        `Duplicate charge rejected: paymentId=${payment.id}`,
        PaymentService.name,
      );
    } else if (code.startsWith('4') && code !== '429') {
      // Ditolak permanen → lepaskan kuota voucher
      this.logger.error(
        `Midtrans rejected charge: paymentId=${payment.id} code=${code} message=${res.status_message}`,
        undefined,
        PaymentService.name,
      );
      await this.paymentRepository.markFailed(payment.id, 'FAILED');
    } else {
      // 5xx / 429: sementara, biarkan PENDING
      this.logger.warn(
        `Midtrans charge failed temporarily: paymentId=${payment.id} code=${code}`,
        PaymentService.name,
      );
    }

    return this.findPaymentOrThrow(payment.id);
  }
  private async saveQrFrom(paymentId: string, res: MidtransResponse) {
    if (!res.qr_string || !res.expiry_time) return;

    const expiresAt = this.midtrans.parseExpiry(res.expiry_time);
    if (Number.isNaN(expiresAt.getTime())) return;

    const qrUrl =
      res.actions?.find((a) => a.name === 'generate-qr-code')?.url ?? null;

    await this.paymentRepository.saveQr(paymentId, qrUrl!, expiresAt);
  }

  private async applyProviderStatus(
    payment: PaymentRef,
    status: MidtransResponse,
  ): Promise<boolean> {
    const providerAmount = Number(status.gross_amount);
    const expectedAmount = Number(payment.totalAmount);

    if (
      status.order_id !== payment.midtransOrderId ||
      status.gross_amount == null ||
      !Number.isFinite(providerAmount) ||
      providerAmount !== expectedAmount
    ) {
      throw new BadGatewayException(
        'Payment gateway returned inconsistent transaction data',
      );
    }

    switch (status.transaction_status) {
      case 'settlement': {
        const updated = await this.paymentRepository.markPaid(payment.id);
        if (!updated) {
          // Sudah PAID (webhook/poll lain lebih dulu) atau sudah FAILED/EXPIRED
          const latest = await this.paymentRepository.findById(payment.id);
          if (latest?.paymentStatus !== 'PAID') {
            this.logger.error(
              `Settlement received for ${latest?.paymentStatus} payment, manual review required: paymentId=${payment.id}`,
              undefined,
              PaymentService.name,
            );
          }
        }
        return true;
      }

      case 'expire':
        await this.paymentRepository.markFailed(payment.id, 'EXPIRED');
        return true;

      case 'cancel':
      case 'deny':
        await this.paymentRepository.markFailed(payment.id, 'FAILED');
        return true;

      case 'pending':
        return true;

      default:
        return false;
    }
  }
}
