import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { category?: string; isActive?: string; lowStock?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.productsService.findAll({
      page,
      limit,
      search: query.search,
      category: query.category,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'desc',
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
      lowStock: query.lowStock === 'true',
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get('low-stock')
  async getLowStock() {
    const data = await this.productsService.getLowStockProducts();
    return { success: true, data };
  }

  @Get('categories')
  async getCategories() {
    const data = await this.productsService.getCategories();
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.findById(id);
    return { success: true, data };
  }

  @Get(':id/detail')
  async getProductDetail(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.getProductDetail(id);
    return { success: true, data };
  }

  @Get(':id/sales')
  async getProductSales(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.getProductSales(id);
    return { success: true, data };
  }

  @Get(':id/returns')
  async getProductReturns(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.getProductReturns(id);
    return { success: true, data };
  }

  @Get(':id/movements')
  async getProductStockMovements(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.getProductStockMovements(id);
    return { success: true, data };
  }

  @Get(':id/stats')
  async getProductStats(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.productsService.getProductStats(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const data = await this.productsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    const data = await this.productsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.productsService.delete(id);
    return { success: true, message: 'Urun basariyla silindi' };
  }
}
