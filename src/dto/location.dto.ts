// modules/location/dto/create-location.dto.ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MaxLength(100, { message: 'Store name must not exceed 100 characters' })
  storeName: string;

  @IsString()
  @IsNotEmpty({ message: 'Booth name is required' })
  @MaxLength(100, { message: 'Booth name must not exceed 100 characters' })
  nameBooth: string;

  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(200, { message: 'Street must not exceed 200 characters' })
  street: string;
}
