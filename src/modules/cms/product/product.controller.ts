import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service.js';
import {
  CreateProductDto,
  FilterProductDto,
} from '../../../dto/product.dto.js';
import { RequestUser } from '../../../entity/requestUser.entity.js';
import { CurrentUser } from '../../../common/decorators/currentUser.decorator.js';
import { ResponseMessage } from '../../../common/decorators/metadata.decorator.js';
import { SetActiveDto } from '../../../dto/setActive.dto.js';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ResponseMessage('Product created successfully')
  @Header('content-type', 'application/json')
  async createProduct(
    @Body() dto: CreateProductDto,
    @CurrentUser()
    user: RequestUser,
  ) {
    await this.productService.postProduct(dto, user.tenantId, user.sub);
  }

  @ResponseMessage('Product status updated successfully')
  @Patch(':id/status')
  async setActive(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetActiveDto,
  ) {
    return await this.productService.setActive(
      user.tenantId,
      id,
      dto.isActive,
      user.sub,
    );
  }

  @Get()
  @ResponseMessage('Products retrieved successfully')
  @Header('content-type', 'application/json')
  async getListProduct(
    @CurrentUser()
    user: RequestUser,
    @Query() filter: FilterProductDto,
  ) {
    return await this.productService.getProduct(
      user.tenantId,
      filter,
      user.sub,
    );
  }
}
