import { Transform, Type, plainToInstance } from 'class-transformer';
import { toNumber, trimString } from '../common/validation/transforms.js';
import { IsDateOnOrAfter } from '../common/validation/isDateOnOrAfter.decorator.js';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  ValidateIf,
  Max,
  ArrayUnique,
  IsUUID,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class SlotDto {
  @IsInt() x: number;
  @IsInt() y: number;
  @IsInt() width: number;
  @IsInt() height: number;
}

export class CreateFrameDto {
  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @Transform(trimString)
  @IsString({ message: 'Frame type must be a string' })
  @IsNotEmpty({ message: 'Frame type is required' })
  frameType: string;

  @Transform(
    ({ value }) => {
      let parsed: unknown = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch {
          throw new BadRequestException('Booth IDs must be a valid JSON array');
        }
      }
      return parsed;
    },
    { toClassOnly: true },
  )
  @IsArray({ message: 'Booth IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one Booth ID is required' })
  @ArrayUnique({
    message: 'Booth IDs must not contain duplicates',
  })
  @IsUUID('4', { each: true, message: 'Each Booth ID must be a valid UUID' })
  boothIds: string[];

  @Transform(
    ({ value }) => {
      if (typeof value === 'string') {
        try {
          const parsedArray = JSON.parse(value);
          return plainToInstance(SlotDto, parsedArray);
        } catch {
          return value;
        }
      }
      return value;
    },
    { toClassOnly: true },
  )
  @IsArray({ message: 'Slots must be an array' })
  @ArrayMinSize(1, {
    message: 'Slots must contain at least one item',
  })
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];
}

export class CreateCustomFrameDto {
  @Transform(trimString)
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @Transform(
    ({ value }) => {
      let parsed: unknown = value;
      if (typeof value === 'string') {
        try {
          parsed = JSON.parse(value);
        } catch {
          throw new BadRequestException('Booth IDs must be a valid JSON array');
        }
      }
      return parsed;
    },
    { toClassOnly: true },
  )
  @IsArray({ message: 'Booth IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one Booth ID is required' })
  @ArrayUnique({
    message: 'Booth IDs must not contain duplicates',
  })
  @ValidateNested({ each: true })
  @IsUUID('4', { each: true, message: 'Each Booth ID must be a valid UUID' })
  boothIds: string[];

  @Transform(
    ({ value }) => {
      if (typeof value === 'string') {
        try {
          const parsedArray = JSON.parse(value);
          return plainToInstance(SlotDto, parsedArray);
        } catch {
          return value;
        }
      }
      return value;
    },
    { toClassOnly: true },
  )
  @IsArray({ message: 'Slots must be an array' })
  @ArrayMinSize(1, {
    message: 'Slots must contain at least one item',
  })
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots: SlotDto[];

  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Valid from must be a valid ISO 8601 date string' },
  )
  validFrom: string;

  @IsDateString(
    { strict: true, strictSeparator: true },
    { message: 'Valid until must be a valid ISO 8601 date string' },
  )
  @IsDateOnOrAfter('validFrom', {
    message: 'Valid until must be on or after valid from',
  })
  validUntil: string;
}

export class FilterFrameDto {
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
