import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsDateString,
  IsBoolean,
  Max,
  Min,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  MaxLength,
  ArrayMinSize,
  ArrayUnique,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  toArray,
  toNumber,
  trimString,
} from '../common/validation/transforms.js';
import { IsDateOnOrAfter } from '../common/validation/isDateOnOrAfter.decorator.js';

export class CreateVoucherDto {
  @Transform(trimString)
  @IsString({ message: 'Voucher code must be a string' })
  @IsNotEmpty({ message: 'Voucher code is required' })
  @MaxLength(50, { message: 'Voucher code must not exceed 50 characters' })
  voucherCode: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Discount percent must be a number with at most 2 decimal places',
    },
  )
  @Min(1, { message: 'Discount percent must be greater than or equal to 1' })
  @Max(100, { message: 'Discount percent must not exceed 100' })
  discountPercent: number;

  @IsInt({ message: 'Quota must be an integer' })
  @Min(0, { message: 'Quota must be greater than or equal to 0' })
  @Max(2147483647, { message: 'Quota must not exceed 2147483647' })
  quota: number;

  @IsArray({ message: 'Booth IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one Booth ID is required' })
  @ArrayUnique({
    message: 'Booth IDs must not contain duplicates',
  })
  @IsUUID('4', { each: true, message: 'Each Booth ID must be a valid UUID' })
  boothIds: string[];

  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Valid from must be a valid ISO 8601 date string' },
  )
  validFrom: string;

  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Valid until must be a valid ISO 8601 date string' },
  )
  @IsDateOnOrAfter('validFrom', {
    message: 'Valid until must be on or after valid from',
  })
  validUntil: string;
}

// Full-update (PUT) contract: keep the same required fields as creation.
export class UpdateVoucherDto extends CreateVoucherDto {
  @IsInt({ message: 'Used count must be an integer' })
  @Min(0, { message: 'Used count must be greater than or equal to 0' })
  @Max(2147483647, { message: 'Used count must not exceed 2147483647' })
  usedCount: number;

  @IsBoolean({ message: 'isActive must be a boolean (true or false)' })
  isActive: boolean;
}

export enum VoucherStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum QuotaStatus {
  AVALIABLE = 'available',
  EXHAUSTED = 'exhausted',
}

export enum VoucherSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  QUOTA = 'quota',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class VoucherFilterDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toArray)
  @IsArray({ message: 'Status must be an array' })
  @ArrayNotEmpty({ message: 'Status must contain at least one value' })
  @IsEnum(VoucherStatus, {
    each: true,
    message: 'Each status must be active or inactive',
  })
  status?: VoucherStatus[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toArray)
  @IsArray({ message: 'Quota status must be an array' })
  @ArrayNotEmpty({ message: 'Quota status must contain at least one value' })
  @IsEnum(QuotaStatus, {
    each: true,
    message: 'Each quota status must be available or exhausted',
  })
  quotaStatus?: QuotaStatus[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString({ message: 'Search must be a string' })
  @MaxLength(100, { message: 'Search must not exceed 100 characters' })
  search?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Minimum quota must be an integer' })
  @Min(0, { message: 'Minimum quota must be greater than or equal to 0' })
  quotaMin?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Maximum quota must be an integer' })
  @Min(0, { message: 'Maximum quota must be greater than or equal to 0' })
  quotaMax?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Minimum remaining quota must be an integer' })
  @Min(0, {
    message: 'Minimum remaining quota must be greater than or equal to 0',
  })
  remainingMin?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Maximum remaining quota must be an integer' })
  @Min(0, {
    message: 'Maximum remaining quota must be greater than or equal to 0',
  })
  remainingMax?: number;

  @IsEnum(VoucherSortBy, {
    message: 'Sort by must be createdAt, name, or quota',
  })
  sortBy?: VoucherSortBy = VoucherSortBy.CREATED_AT;

  @IsEnum(SortOrder, { message: 'Sort order must be asc or desc' })
  sortOrder?: SortOrder = SortOrder.DESC;

  @Transform(toNumber)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than or equal to 1' })
  @Max(2147483647, { message: 'Page must not exceed 2147483647' })
  page? = 1;

  @Transform(toNumber)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  limit? = 20;
}
