import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../common/validation/transforms.js';

export class CreateTenantDto {
  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @Transform(trimString)
  @IsString({ message: 'Brand name must be a string' })
  @IsNotEmpty({ message: 'Brand name is required' })
  @MaxLength(50, { message: 'Brand name must not exceed 50 characters' })
  brandName: string;

  @Transform(trimString)
  @IsNotEmpty({ message: 'About is required' })
  @IsString({ message: 'About must be a string' })
  about: string;
}
