import { Module } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { ProductController } from './product.controller.js';
import { ProductRepository } from './product.repository.js';

@Module({
  providers: [ProductService, ProductRepository],
  controllers: [ProductController]
})
export class ProductModule {}
