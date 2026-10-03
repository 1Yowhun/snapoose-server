import {
  IsString,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class CreateFrameDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Frame type must be a string' })
  @IsNotEmpty({ message: 'Frame type is required' })
  frameType: string;
}

export class CreateCustomFrameDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsDateString({}, { message: 'Valid from must be a valid date string' })
  validFrom?: Date;

  @IsDateString({}, { message: 'Valid until must be a valid date string' })
  validUntil?: Date;
}
