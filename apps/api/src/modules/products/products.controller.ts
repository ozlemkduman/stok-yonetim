import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { category?: string; isActive?: string; lowStock?: string }) {
    return this.productsService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      category: query.category,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'desc',
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
      lowStock: query.lowStock === 'true',
    });
  }

  @Get('low-stock')
  async getLowStock() {
    return this.productsService.getLowStockProducts();
  }

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Get(':id/detail')
  async getProductDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductDetail(id);
  }

  @Get(':id/sales')
  async getProductSales(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductSales(id);
  }

  @Get(':id/returns')
  async getProductReturns(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductReturns(id);
  }

  @Get(':id/movements')
  async getProductStockMovements(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductStockMovements(id);
  }

  @Get(':id/stats')
  async getProductStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.getProductStats(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.delete(id);
    return { message: 'Urun basariyla silindi' };
  }
}
