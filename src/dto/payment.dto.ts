import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class PaymentDto {
  @IsUUID('4', { message: 'Product ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsUUID('4', { message: 'Frame ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Frame ID is required' })
  frameId: string;

  @IsUUID('4', { message: 'Voucher ID must be a valid UUID v4' })
  @IsOptional()
  voucherId?: string;

  @IsUUID('4', { message: 'Booth ID must be a valid UUID v4' })
  @IsOptional()
  boothId?: string;
}
