import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateInstallDto {
  @IsNotEmpty({ message: 'Location ID is required' })
  @IsUUID('4', { each: true, message: 'Each Location ID must be a valid UUID' })
  locationId: string;

  @IsNotEmpty({ message: 'Booth ID is required' })
  @IsUUID('4', { each: true, message: 'Each Booth ID must be a valid UUID' })
  boothId: string;

  @IsUUID('4', { each: true, message: 'Each Voucher ID must be a valid UUID' })
  voucherId?: string;
}
