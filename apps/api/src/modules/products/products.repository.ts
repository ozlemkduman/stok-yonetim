import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Knex } from 'knex';

export interface Product {
  id: string;
  name: string;
  barcode: string | null;
  category: string | null;
  unit: string;
  purchase_price: number;
  sale_price: number;
  vat_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProductListParams {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isActive?: boolean;
  lowStock?: boolean;
}

@Injectable()
export class ProductsRepository {
  private readonly tableName = 'products';

  constructor(private readonly db: DatabaseService) {}

  async findAll(params: ProductListParams): Promise<{ items: Product[]; total: number }> {
    const { page, limit, search, category, sortBy, sortOrder, isActive, lowStock } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex(this.tableName);
    let countQuery = this.db.knex(this.tableName);

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    if (category) {
      query = query.where('category', category);
      countQuery = countQuery.where('category', category);
    }

    if (lowStock) {
      query = query.whereRaw('stock_quantity <= min_stock_level');
      countQuery = countQuery.whereRaw('stock_quantity <= min_stock_level');
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where((builder) => {
        builder
          .whereILike('name', searchTerm)
          .orWhereILike('barcode', searchTerm)
          .orWhereILike('category', searchTerm);
      });
      countQuery = countQuery.where((builder) => {
        builder
          .whereILike('name', searchTerm)
          .orWhereILike('barcode', searchTerm)
          .orWhereILike('category', searchTerm);
      });
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(sortBy, sortOrder).limit(limit).offset(offset).select('*'),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Product | null> {
    return this.db.knex(this.tableName).where('id', id).first() || null;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.db.knex(this.tableName).where('barcode', barcode).first() || null;
  }

  async create(data: CreateProductDto): Promise<Product> {
    const [product] = await this.db.knex(this.tableName).insert(data).returning('*');
    return product;
  }

  async update(id: string, data: UpdateProductDto): Promise<Product | null> {
    const [product] = await this.db.knex(this.tableName)
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return product || null;
  }

  async updateStock(id: string, quantity: number, trx?: Knex.Transaction): Promise<void> {
    const query = trx ? trx(this.tableName) : this.db.knex(this.tableName);
    await query.where('id', id).update({
      stock_quantity: this.db.knex.raw('stock_quantity + ?', [quantity]),
      updated_at: this.db.knex.fn.now(),
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.knex(this.tableName)
      .where('id', id)
      .update({ is_active: false, updated_at: this.db.knex.fn.now() });
    return result > 0;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.db.knex(this.tableName)
      .whereRaw('stock_quantity <= min_stock_level')
      .where('is_active', true)
      .orderBy('stock_quantity', 'asc')
      .select('*');
  }

  async getCategories(): Promise<string[]> {
    const results = await this.db.knex(this.tableName)
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category');
    return results.map((r) => r.category);
  }
}
