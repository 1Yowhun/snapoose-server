import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsUUID,
  IsOptional,
  IsArray,
  IsIn,
} from 'class-validator';

export class CreateBoothDto {
  @IsUUID('4', { message: 'location id must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Location Id is required' })
  locationId: string;

  @IsString()
  @IsNotEmpty({ message: 'Street is required' })
  @MaxLength(100, { message: 'Street must not exceed 200 characters' })
  name: string;

  @IsOptional()
  @MaxLength(50, { message: 'Serial number must not exceed 200 characters' })
  serialNumber?: string;
}

const toArray = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

export class FilterBoothDto {
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true })
  locationIds?: string[];


  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(['active', 'inactive'], { each: true })
  statuses?: ('active' | 'inactive')[];
}