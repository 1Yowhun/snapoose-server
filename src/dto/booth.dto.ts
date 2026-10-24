import { Transform } from 'class-transformer';
import { toArray, toNumber, trimString } from '../common/validation/transforms.js';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsOptional,
  IsArray,
  IsIn,
  ValidateIf,
  ArrayNotEmpty,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateBoothDto {
  @IsUUID('4', { message: 'Location ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Location ID is required' })
  locationId: string;

  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Serial number must be a string' })
  @IsNotEmpty({ message: 'Serial number must not be empty' })
  @MaxLength(50, { message: 'Serial number must not exceed 50 characters' })
  serialNumber?: string | null;
}

export class FilterBoothDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toArray)
  @IsArray({ message: 'Location IDs must be an array' })
  @ArrayNotEmpty({ message: 'Location IDs must contain at least one value' })
  @IsUUID('4', {
    each: true,
    message: 'Each location ID must be a valid UUID v4',
  })
  locationIds?: string[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toArray)
  @IsArray({ message: 'Statuses must be an array' })
  @ArrayNotEmpty({ message: 'Statuses must contain at least one value' })
  @IsIn(['active', 'inactive'], {
    each: true,
    message: 'Each status must be active or inactive',
  })
  statuses?: ('active' | 'inactive')[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than or equal to 1' })
  @Max(2147483647, { message: 'Page must not exceed 2147483647' })
  page? = 1;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  @Max(20, { message: 'Limit must not exceed 20' })
  limit? = 20;
}
