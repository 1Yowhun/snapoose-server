import { Transform, Type, plainToInstance } from 'class-transformer';
import { trimString } from '../common/validation/transforms.js';
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
