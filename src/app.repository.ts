import { Inject } from '@nestjs/common';
import { DRIZZLE } from './shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray, ne, notInArray } from 'drizzle-orm';
import {
  frameBooths,
  frames,
} from './shared/infra/database/schema/frame.schema.js';
import {
  products,
  productBooths,
} from './shared/infra/database/schema/product.schema.js';
import {
  vouchers,
  voucherBooths,
} from './shared/infra/database/schema/voucher.schema.js';
import { booths } from './shared/infra/database/schema/booth.schema.js';

export class AppRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async findInstallableBooths(
    tenantId: string,
    locationId: string,
    boothId: string,
  ) {
    const [data] = await this.db
      .select({ id: booths.id })
      .from(booths)
      .where(
        and(
          eq(booths.id, boothId),
          eq(booths.tenantId, tenantId),
          eq(booths.locationId, locationId),
          eq(booths.isActive, true),
        ),
      )
      .limit(1);

    return data ?? null;
  }

  async bindDevice(
    tenantId: string,
    serialNumber: string,
    boothId: string,
    tokenId: string,
    userId: string,
  ) {
    await this.db.transaction(async (tx) => {
      // Lepas mesin ini dari booth lama (jika pindah booth)
      await tx
        .update(booths)
        .set({ serialNumber: null, deviceTokenId: null, updatedBy: userId })
        .where(
          and(eq(booths.serialNumber, serialNumber), ne(booths.id, boothId)),
        );

      await tx
        .update(booths)
        .set({ serialNumber, deviceTokenId: tokenId, updatedBy: userId })
        .where(and(eq(booths.tenantId, tenantId), eq(booths.id, boothId)));
    });
  }

  async isDeviceTokenActive(
    tenantId: string,
    serialNumber: string,
    tokenId: string,
  ) {
    const [data] = await this.db
      .select({ id: booths.id })
      .from(booths)
      .where(
        and(
          eq(booths.tenantId, tenantId),
          eq(booths.serialNumber, serialNumber),
          eq(booths.deviceTokenId, tokenId),
          eq(booths.isActive, true),
        ),
      )
      .limit(1);

    return !!data;
  }

  async getDataByBooth(tenantId: string, boothId: string) {
    const [availableProducts, availableFrames, availableVouchers] =
      await Promise.all([
        this.db
          .select()
          .from(products)
          .where(
            and(
              eq(products.tenantId, tenantId),
              eq(products.isActive, true),
              inArray(
                products.id,
                this.db
                  .select({ productId: productBooths.productId })
                  .from(productBooths)
                  .where(eq(productBooths.boothId, boothId)),
              ),
            ),
          ),

        this.db
          .select()
          .from(frames)
          .where(
            and(
              eq(frames.tenantId, tenantId),
              eq(frames.isActive, true),
              inArray(
                frames.id,
                this.db
                  .select({ frameId: frameBooths.frameId })
                  .from(frameBooths)
                  .where(eq(frameBooths.boothId, boothId)),
              ),
            ),
          ),

        this.db
          .select()
          .from(vouchers)
          .where(
            and(
              eq(vouchers.tenantId, tenantId),
              eq(vouchers.isActive, true),
              inArray(
                vouchers.id,
                this.db
                  .select({ voucherId: voucherBooths.voucherId })
                  .from(voucherBooths)
                  .where(eq(voucherBooths.boothId, boothId)),
              ),
            ),
          ),
      ]);

    return {
      products: availableProducts,
      frames: availableFrames,
      vouchers: availableVouchers,
    };
  }
}
