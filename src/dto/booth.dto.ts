import { Transform } from 'class-transformer';
import { toArray, trimString } from '../common/validation/transforms.js';
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
}
