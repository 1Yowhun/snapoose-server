import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { toNumber, trimString } from '../common/validation/transforms.js';
import { SetActiveDto } from './setActive.dto.js';

export class CreateLocationDto {
  @Transform(trimString)
  @IsString({ message: 'Store name must be a string' })
  @IsNotEmpty({ message: 'Store name is required' })
  @MaxLength(50, { message: 'Store name must not exceed 50 characters' })
  storeName: string;

  @Transform(trimString)
  @IsString({ message: 'Street must be a string' })
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(200, { message: 'Street must not exceed 200 characters' })
  street: string;
}

export class FilterLocationDto {
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

export class SetLocationActiveDto extends SetActiveDto {}
