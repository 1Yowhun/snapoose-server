import {
  Body,
  Controller,
  Header,
  Post,
  Headers,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service.js';
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { PaymentDto } from '../../dto/payment.dto.js';
import { DeviceOnly } from '../../common/decorators/device.decorator.js';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import { RequestDevice } from '../../entity/requestUser.entity.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { MidtransNotification } from '../../shared/infra/midtrans/midtrans.client.js';
import type { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly PaymentService: PaymentService) {}

  @DeviceOnly()
  @Post()
  @ResponseMessage('Payment request processed')
  @Header('content-type', 'application/json')
  async payment(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: PaymentDto,
    @CurrentUser() device: RequestDevice,
  ) {
    return await this.PaymentService.createPayment(device, idempotencyKey, dto);
  }

  @DeviceOnly()
  @Get(':id/status')
  @ResponseMessage('Test get status')
  @Header('content-type', 'application/json')
  async Test(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() device: RequestDevice,
  ) {
    console.log(device);
    return await this.PaymentService.getStatusMidtrans(
      id,
      device
    );
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Webhook successfully')
  async getWebhook(
    @Req() req: Request,
    @Body() notification: MidtransNotification,
  ) {
    console.log('Webhook incoming', {
      method: req.method,
      url: req.originalUrl,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      bodyPresent: req.body != null,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      notificationPresent: notification != null,
    });

    await this.PaymentService.handleNotification(notification);
    return { received: true };
  }
}
