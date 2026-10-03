import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVoucherDto {
  @IsString({ message: 'Voucher code must be a string' })
  @IsNotEmpty({ message: 'Voucher code should not be empty' })
  voucherCode: string;

  @IsNumber({}, { message: 'Discount percent must be a valid number' })
  discountPercent: number;

  @IsInt({ message: 'Quota must be an integer' })
  quota: number;

  @IsDate({ message: 'Valid from must be a valid date' })
  @Type(() => Date)
  validFrom: Date;

  @IsDate({ message: 'Valid until must be a valid date' })
  @Type(() => Date)
  validUntil: Date;
}

export class UpdateVoucherDto {
  @IsString({ message: 'Voucher code must be a string' })
  @IsNotEmpty({ message: 'Voucher code should not be empty' })
  voucherCode: string;

  @IsNumber({}, { message: 'Discount percent must be a valid number' })
  discountPercent: number;

  @IsInt({ message: 'Quota must be an integer' })
  quota: number;

  @IsInt({ message: 'Used count must be an integer' })
  usedCount: number;

  @IsBoolean({ message: 'isActive must be a boolean, either true or false' })
  isActive: boolean;

  @IsDate({ message: 'Valid from must be a valid date' })
  @Type(() => Date)
  validFrom: Date;

  @IsDate({ message: 'Valid until must be a valid date' })
  @Type(() => Date)
  validUntil: Date;
}
