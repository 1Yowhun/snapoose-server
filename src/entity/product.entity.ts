export class Product {
  id: string;
  code: string;
  tenantId: string;
  name: string;
  price: number;
  includedPrintQuantity?: number;
  isPrintable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
