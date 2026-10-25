import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from '../common/validation/transforms.js';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
export class CreateUserDto {
  @IsUUID('4', { message: 'Tenant ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Tenant ID is required' })
  tenantId: string;

  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @MinLength(5, {
    message: 'Name must be at least 5 characters long',
  })
  @MaxLength(20, {
    message: 'Name must not exceed 20 characters',
  })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  // Passwords must never be trimmed or otherwise normalized.
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
