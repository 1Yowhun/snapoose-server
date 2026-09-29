export class Booth {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    status: boolean;
    installedAt: Date;
    updatedAt: Date;
    updatedBy: string;
    createdBy: string;
    constructor(partial: Partial<Booth>) {
      Object.assign(this, partial);
    }
  }
  
