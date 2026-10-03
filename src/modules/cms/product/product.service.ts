import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../../../dto/product.dto.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { generateId } from '../../../common/utils/generateCode.js';
import { AppLogger } from '../../../common/logger.service.js';
import { ProductRepository } from './product.repository.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly logger: AppLogger,
  ) {}

  async postProduct(data: CreateProductDto, user: RequestUser) {
    try {
      const now = new Date();
      const payload = {
        ...data,
        code: `PRD-${generateId()}`,
        tenantId: user.tenantId,
        isActive: true,
        isPrintable: true,
        includedPrintQuantity: 2,
        createdBy: user.sub,
        updatedBy: user.sub,
        createdAt: now,
        updatedAt: now,
      };
      const product = await this.productRepository.createProduct(payload);
      this.logger.log(`Product berhasil dibuat`, ProductService.name);
      return product;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat Product',
        error,
        ProductService.name,
      );
      throw error;
    }
  }

  async getProduct(){
    try {
      const product = await this.productRepository.getAllProductList();
      this.logger.log(`Product berhasil diambil`, ProductService.name);
      return product;
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika mengambil data Product',
        error,
        ProductService.name,
      );
      throw error;
    }
  }
}
