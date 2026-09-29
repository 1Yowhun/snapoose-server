export class Voucher {
  id: string;
  code: string;
  tenantId: string;
  voucherCode: string;
  discountPercent: number;
  quota: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  createdBy: string;

  constructor(partial: Partial<Voucher>) {
    Object.assign(this, partial);
  }
}
