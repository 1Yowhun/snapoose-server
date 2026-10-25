import { IsArray, ArrayMinSize, ArrayUnique, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateInstallDto {
  @IsArray({ message: 'Location IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one Location ID is required' })
  @ArrayUnique({
    message: 'Location IDs must not contain duplicates',
  })
  @IsUUID('4', { each: true, message: 'Each Location ID must be a valid UUID' })
  locationIds: string[];

  @IsArray({ message: 'Booth IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one Booth ID is required' })
  @ArrayUnique({
    message: 'Booth IDs must not contain duplicates',
  })
  @IsUUID('4', { each: true, message: 'Each Booth ID must be a valid UUID' })
  boothIds: string[];

  @IsNotEmpty({
    message: 'Tenant ID is required',
  })
  @IsUUID('4', {
    message: 'Tenant ID must be a valid UUID v4',
  })
  tenantId: string;
}
