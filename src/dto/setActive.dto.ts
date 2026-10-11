// src/common/dto/set-active.dto.ts
import { IsBoolean } from 'class-validator';

export class SetActiveDto {
  @IsBoolean()
  isActive: boolean;
}