import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { PaymentRepository } from './payment.repository.js';

@Module({
    controllers: [PaymentController],
    providers: [PaymentService, PaymentRepository]
})
export class PaymentModule {}
