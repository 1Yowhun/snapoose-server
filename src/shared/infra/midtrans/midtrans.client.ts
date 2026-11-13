import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';

export interface MidtransResponse {
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
  status_code: string;
  status_message: string;
  transaction_status?: string;
  order_id?: string;
  gross_amount?: string;
  qr_string?: string;
  expiry_time?: string;
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
}

@Injectable()
export class MidtransClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly serverKey: string;
  private readonly signatureSecretKey: string;

  constructor(config: ConfigService) {
    this.baseUrl =
      config.get('MIDTRANS_IS_PRODUCTION') === 'true'
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';
    this.signatureSecretKey = config.getOrThrow<string>(
      'MIDTRANS_SIGNATURE_SECRET_KEY',
    );
    this.serverKey = config.getOrThrow<string>('SERVER_KEY_SANDBOX');
    this.authHeader =
      'Basic ' + Buffer.from(`${this.serverKey}:`).toString('base64');
  }

  async chargeQris(orderId: string, grossAmount: number) {
    return this.request('POST', '/v2/charge', {
      payment_type: 'qris',
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      custom_expiry: { expiry_duration: 5, unit: 'minute' },
    });
  }

  async getStatus(orderId: string) {
    return this.request('GET', `/v2/${orderId}/status`);
  }

  async getQrString(orderId: string) {
    return this.request('GET', `/v2/${orderId}/qr-code`);
  }

  async cancel(orderId: string) {
    return this.request('POST', `/v2/${orderId}/cancel`);
  }

  // sha512(order_id + status_code + gross_amount + server_key)
  verifySignature(n: MidtransNotification): boolean {
    const expected = createHash('sha512')
      .update(
        n.order_id + n.status_code + n.gross_amount + this.signatureSecretKey,
      )
      .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(n.signature_key ?? '');

    return a.length === b.length && timingSafeEqual(a, b);
  }

  // expiry_time Midtrans berformat "YYYY-MM-DD HH:mm:ss" dalam WIB
  parseExpiry(expiryTime: string) {
    return new Date(expiryTime.replace(' ', 'T') + '+07:00');
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
    // Status asli ada di body.status_code, bukan HTTP status
    return (await res.json()) as MidtransResponse;
  }
}
