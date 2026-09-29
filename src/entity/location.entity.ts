export class Location {
  id: string;
  tenantId: string;
  code: string;
  storeName: string;
  nameBooth: string;
  street: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  createdBy: string;

  constructor(partial: Partial<Location>) {
    Object.assign(this, partial);
  }
}
