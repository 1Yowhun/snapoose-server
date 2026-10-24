import { IsBoolean } from 'class-validator';

export class SetActiveDto {
  @IsBoolean({ message: 'isActive must be a boolean (true or false)' })
  isActive: boolean;
}
