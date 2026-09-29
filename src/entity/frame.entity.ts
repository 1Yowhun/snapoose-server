export class Frame {
  id: string;
  code: string;
  tenantId: string;
  name: string;
  imagePath: string;
  frameType: string;
  validFrom?: Date | null;
  validUntil?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  createdBy: string;

  constructor(partial: Partial<Frame>) {
    Object.assign(this, partial);
  }
}
