import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateProductDto,
  FilterProductDto,
} from '../../../dto/product.dto.js';
import { AppLogger } from '../../../common/logger.service.js';
import { ProductRepository } from './product.repository.js';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly logger: AppLogger,
  ) {}

  async postProduct(data: CreateProductDto, tenantId: string, userId: string) {
    const { boothIds, ...productDetails } = data;
    const newProductData = {
      ...productDetails,
      tenantId: tenantId, 
      createdBy: userId,
      updatedBy: userId,
    };
    const product = await this.productRepository.createProduct(
      { ...newProductData },
      boothIds
    );
    this.logger.log(
      `Product created: productId=${product.id} tenantId=${tenantId} userId=${userId}`,
      ProductService.name,
    );
    return product;
  }

  async setActive(
    tenantId: string,
    id: string,
    isActive: boolean,
    userId: string,
  ) {
    const product = await this.productRepository.getProductById(tenantId, id);
    if (!product) throw new NotFoundException('Product not found');

    const productUpdate = await this.productRepository.updateActive(
      tenantId,
      id,
      isActive,
      userId,
    );
    this.logger.log(
      `Product status updated: productId=${id} tenantId=${tenantId} userId=${userId} isActive=${isActive}`,
      ProductService.name,
    );
    return productUpdate;
  }

  async getProduct(tenantId: string, filter: FilterProductDto, userId: string) {
    if (
      filter.minPrice !== undefined &&
      filter.maxPrice !== undefined &&
      filter.minPrice > filter.maxPrice
    ) {
      throw new BadRequestException(
        'Minimum price must not exceed maximum price',
      );
    }
    const products = await this.productRepository.getAllProductList(
      tenantId,
      filter,
    );
    this.logger.debug(
      `Products retrieved: tenantId=${tenantId} userId=${userId} count=${products.items.length}`,
      ProductService.name,
    );
    return products;
  }
}
