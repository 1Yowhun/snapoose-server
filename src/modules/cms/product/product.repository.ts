import { HttpException, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../../shared/infra/database/drizzle.factory.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  NewProduct,
  Product,
  productBooths,
  products,
} from '../../../shared/infra/database/schema/product.schema.js';
import { SQL, and, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { FilterProductDto } from '../../../dto/product.dto.js';
import { PaginatedResult } from '../../../common/interface/pagination.interface.js';
import { booths } from '../../../shared/infra/database/schema/booth.schema.js';
import { catalogues } from '../../../shared/infra/database/schema/catalogue.schema.js';

type BoothSummary = { id: string; name: string };
export type ProductWithBooths = Product & { validAtBooths: BoothSummary[] };

export class ProductRepository {
  constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase) {}

  async createProduct(data: NewProduct, boothIds: string[]) {
    const uniqueBoothIds = [...new Set(boothIds)];
    try {
      return await this.db.transaction(async (tx) => {
        if (uniqueBoothIds.length > 0) {
          const found = await tx
            .select({ id: booths.id })
            .from(booths)
            .where(
              and(
                inArray(booths.id, uniqueBoothIds),
                eq(booths.tenantId, data.tenantId),
              ),
            );
          if (found.length !== uniqueBoothIds.length) {
            throw new NotFoundException('Booth not found');
          }
        }

        const [newProduct] = await tx.insert(products).values(data).returning();

        if (uniqueBoothIds.length > 0) {
          await tx.insert(productBooths).values(
            uniqueBoothIds.map((boothId) => ({
              productId: newProduct.id,
              boothId,
            })),
          );
        }

        await tx
          .insert(catalogues)
          .values({ tenantId: data.tenantId, productSync: sql`now()` })
          .onConflictDoUpdate({
            target: catalogues.tenantId,
            set: { productSync: sql`now()` },
          });

        return newProduct;
      });
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      const err = e.cause ?? e;
      if (err.code === '23503') throw new NotFoundException();
      throw e;
    }
  }

  async getProductById(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
      .limit(1);
    return row ?? null;
  }

  async updateActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    await Promise.all([
      this.db
        .update(products)
        .set({ isActive, updatedAt: new Date(), updatedBy: userId })
        .where(and(eq(products.tenantId, tenantId), eq(products.id, id))),
      this.db
        .insert(catalogues)
        .values({ tenantId: tenantId, productSync: sql`now()` })
        .onConflictDoUpdate({
          target: catalogues.tenantId,
          set: { productSync: sql`now()` },
        }),
    ]);
  }

  async getAllProductList(
    tenantId: string,
    filter: FilterProductDto,
  ): Promise<PaginatedResult<ProductWithBooths>> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;
    const conditions: (SQL | undefined)[] = [eq(products.tenantId, tenantId)];

    if (filter.status?.length) {
      conditions.push(
        inArray(
          products.isActive,
          filter.status.map((status) => status === 'active'),
        ),
      );
    }

    if (filter.minPrice !== undefined) {
      conditions.push(gte(products.price, filter.minPrice));
    }
    if (filter.maxPrice !== undefined) {
      conditions.push(lte(products.price, filter.maxPrice));
    }

    if (filter.boothIds?.length) {
      conditions.push(
        inArray(
          products.id,
          this.db
            .select({ productId: productBooths.productId })
            .from(productBooths)
            .where(inArray(productBooths.boothId, filter.boothIds)),
        ),
      );
    }
    const [items, countRows] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt), desc(products.id))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(products)
        .where(and(...conditions)),
    ]);
    const total = countRows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const boothsByProductId = new Map<string, BoothSummary[]>();
    if (items.length > 0) {
      if (items.length > 0) {
        const boothRelations = await this.db
          .select({
            productId: productBooths.productId,
            booth: { id: booths.id, name: booths.name },
          })
          .from(productBooths)
          .innerJoin(booths, eq(productBooths.boothId, booths.id))
          .where(
            inArray(
              productBooths.productId,
              items.map((i) => i.id),
            ),
          );

        for (const { productId, booth } of boothRelations) {
          const list = boothsByProductId.get(productId);
          if (list) list.push(booth);
          else boothsByProductId.set(productId, [booth]);
        }
      }
    }
    const enrichedItems: ProductWithBooths[] = items.map((item) => ({
      ...item,
      validAtBooths: boothsByProductId.get(item.id) ?? [],
    }));

    return {
      items: enrichedItems,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
