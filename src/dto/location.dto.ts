import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { trimString } from '../common/validation/transforms.js';
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

export class SetLocationActiveDto extends SetActiveDto {}
