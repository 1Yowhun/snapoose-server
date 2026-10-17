import {
  IsString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  ArrayNotEmpty,
  IsArray,
  IsUUID,
  IsInt,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  toArray,
  toNumber,
  trimString,
} from '../common/validation/transforms.js';

export class CreateProductDto {
  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @Transform(toNumber)
  @IsInt({ message: 'Price must be an integer' })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  @Max(2147483647, { message: 'Price must not exceed 2147483647' })
  price: number;
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class FilterProductDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Minimum price must be an integer' })
  @Min(0, { message: 'Minimum price must be greater than or equal to 0' })
  minPrice?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(toNumber)
  @IsInt({ message: 'Maximum price must be an integer' })
  @Min(0, { message: 'Maximum price must be greater than or equal to 0' })
  maxPrice?: number;

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
  @IsArray({ message: 'Status must be an array' })
  @ArrayNotEmpty({ message: 'Status must contain at least one value' })
  @IsEnum(ProductStatus, {
    each: true,
    message: 'Each status must be active or inactive',
  })
  status?: ProductStatus[];
}
