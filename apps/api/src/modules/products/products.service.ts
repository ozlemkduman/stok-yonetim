import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsRepository, Product, ProductListParams } from './products.repository';
import { CreateProductDto, UpdateProductDto } from './dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async findAll(params: ProductListParams): Promise<PaginatedResult<Product>> {
    const { items, total } = await this.productsRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundException(`Urun bulunamadi: ${id}`);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    if (dto.barcode) {
      const existing = await this.productsRepository.findByBarcode(dto.barcode);
      if (existing) throw new ConflictException('Bu barkod zaten kullaniliyor');
    }
    return this.productsRepository.createProduct(dto);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findById(id);
    if (dto.barcode) {
      const existing = await this.productsRepository.findByBarcode(dto.barcode);
      if (existing && existing.id !== id) {
        throw new ConflictException('Bu barkod zaten kullaniliyor');
      }
    }
    const updated = await this.productsRepository.updateProduct(id, dto);
    if (!updated) throw new NotFoundException(`Urun bulunamadi: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.productsRepository.deleteProduct(id);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.productsRepository.getLowStockProducts();
  }

  async getCategories(): Promise<string[]> {
    return this.productsRepository.getCategories();
  }

  async getProductSales(id: string) {
    await this.findById(id);
    return this.productsRepository.getProductSalesWithItems(id);
  }

  async getProductReturns(id: string) {
    await this.findById(id);
    return this.productsRepository.getProductReturns(id);
  }

  async getProductStockMovements(id: string) {
    await this.findById(id);
    return this.productsRepository.getProductStockMovements(id);
  }

  async getProductStats(id: string) {
    await this.findById(id);
    return this.productsRepository.getProductStats(id);
  }

  async getProductDetail(id: string) {
    const product = await this.findById(id);
    const [sales, returns, movements, stats] = await Promise.all([
      this.productsRepository.getProductSalesWithItems(id),
      this.productsRepository.getProductReturns(id),
      this.productsRepository.getProductStockMovements(id),
      this.productsRepository.getProductStats(id),
    ]);

    return {
      product,
      sales,
      returns,
      movements,
      stats,
    };
  }
}
