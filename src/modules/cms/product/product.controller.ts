import { Body, Controller, Get, Header, HttpCode, Post } from '@nestjs/common';
import { ProductService } from './product.service.js';
import { CreateProductDto } from '../../../dto/product.dto.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.productService.postProduct(dto, user);
    const response = {
      success: true,
      message: 'Product created successfully',
    };
    return response;
  }

  @Get()
  @HttpCode(200)
  @Header('content-type', 'application/json')
  async getListProduct(
    @CurrentUser()
    user: RequestUser,
  ) {
    const product = await this.productService.getProduct();
    const response = {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
    return response;
  }
}
