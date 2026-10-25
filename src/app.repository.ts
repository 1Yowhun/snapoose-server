import { Inject } from '@nestjs/common';
import { DRIZZLE } from './shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, inArray } from 'drizzle-orm';
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

  async checkSerialNumber(serialNumber: string, tenantId: string) {
    const [data] = await this.db
      .select()
      .from(booths)
      .where(
        and(
          eq(booths.serialNumber, serialNumber),
          eq(booths.tenantId, tenantId),
          eq(booths.isActive, true),
        ),
      )
      .limit(1);

    return data ?? null;
  }
  async getDataByBooth(tenantId: string, serialNumber: string, dto: string[]) {
    const uniqueBoothIds = [...new Set(dto)];
    if (!uniqueBoothIds || dto.length === 0) {
      return { products: [], frames: [], vouchers: [] };
    }

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
                  .where(inArray(productBooths.boothId, uniqueBoothIds)),
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
                  .where(inArray(frameBooths.boothId, uniqueBoothIds)),
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
                  .where(inArray(voucherBooths.boothId, uniqueBoothIds)),
              ),
            ),
          ),
      ]);

    await this.db
      .update(booths)
      .set({
        serialNumber: serialNumber,
      })
      .where(and(eq(booths.tenantId, tenantId), eq(booths.isActive, true)));
    return {
      products: availableProducts,
      frames: availableFrames,
      vouchers: availableVouchers,
    };
  }
}
