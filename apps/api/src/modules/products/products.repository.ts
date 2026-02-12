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

  async getProductSalesWithItems(productId: string): Promise<any[]> {
    const saleItems = await this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .where('sale_items.product_id', productId)
      .orderBy('sales.sale_date', 'desc')
      .select(
        'sale_items.id',
        'sale_items.sale_id',
        'sale_items.quantity',
        'sale_items.unit_price',
        'sale_items.discount_rate',
        'sale_items.vat_rate',
        'sale_items.vat_amount',
        'sale_items.line_total',
        'sales.invoice_number',
        'sales.sale_date',
        'sales.payment_method',
        'sales.status',
        'customers.id as customer_id',
        'customers.name as customer_name'
      );

    return saleItems;
  }

  async getProductReturns(productId: string): Promise<any[]> {
    const returnItems = await this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .leftJoin('customers', 'returns.customer_id', 'customers.id')
      .where('return_items.product_id', productId)
      .orderBy('returns.return_date', 'desc')
      .select(
        'return_items.id',
        'return_items.return_id',
        'return_items.quantity',
        'return_items.unit_price',
        'return_items.vat_amount',
        'return_items.line_total',
        'returns.return_number',
        'returns.return_date',
        'returns.reason',
        'returns.status',
        'customers.id as customer_id',
        'customers.name as customer_name'
      );

    return returnItems;
  }

  async getProductStockMovements(productId: string): Promise<any[]> {
    return this.db.knex('stock_movements')
      .leftJoin('warehouses', 'stock_movements.warehouse_id', 'warehouses.id')
      .where('stock_movements.product_id', productId)
      .orderBy('stock_movements.movement_date', 'desc')
      .select(
        'stock_movements.*',
        'warehouses.name as warehouse_name'
      );
  }

  async getProductStats(productId: string): Promise<{
    totalSold: number;
    totalReturned: number;
    totalRevenue: number;
    salesCount: number;
    returnsCount: number;
  }> {
    const [salesStats] = await this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sale_items.product_id', productId)
      .where('sales.status', 'completed')
      .select(
        this.db.knex.raw('COALESCE(SUM(sale_items.quantity), 0) as total_quantity'),
        this.db.knex.raw('COALESCE(SUM(sale_items.line_total), 0) as total_revenue'),
        this.db.knex.raw('COUNT(DISTINCT sale_items.sale_id) as sales_count')
      ) as { total_quantity: string; total_revenue: string; sales_count: string }[];

    const [returnsStats] = await this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .where('return_items.product_id', productId)
      .where('returns.status', 'completed')
      .select(
        this.db.knex.raw('COALESCE(SUM(return_items.quantity), 0) as total_quantity'),
        this.db.knex.raw('COUNT(DISTINCT return_items.return_id) as returns_count')
      ) as { total_quantity: string; returns_count: string }[];

    return {
      totalSold: parseInt(salesStats?.total_quantity || '0', 10),
      totalReturned: parseInt(returnsStats?.total_quantity || '0', 10),
      totalRevenue: parseFloat(salesStats?.total_revenue || '0'),
      salesCount: parseInt(salesStats?.sales_count || '0', 10),
      returnsCount: parseInt(returnsStats?.returns_count || '0', 10),
    };
  }
}
