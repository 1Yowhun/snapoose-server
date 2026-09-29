import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBoothDto {
  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(100, { message: 'Street must not exceed 200 characters' })
  name: string;
}