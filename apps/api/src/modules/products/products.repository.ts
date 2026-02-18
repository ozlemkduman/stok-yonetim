import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
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
  wholesale_price: number;
  vat_rate: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  created_by_name?: string;
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
export class ProductsRepository extends BaseTenantRepository<Product> {
  protected tableName = 'products';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: ProductListParams): Promise<{ items: (Product & { total_sold?: number })[]; total: number }> {
    const { page, limit, search, category, sortBy, sortOrder, isActive, lowStock } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone();
    let countQuery = this.query.clone();

    if (isActive !== undefined) {
      query = query.where(`${this.tableName}.is_active`, isActive);
      countQuery = countQuery.where(`${this.tableName}.is_active`, isActive);
    }

    if (category) {
      query = query.where(`${this.tableName}.category`, category);
      countQuery = countQuery.where(`${this.tableName}.category`, category);
    }

    if (lowStock) {
      query = query.whereRaw(`${this.tableName}.stock_quantity <= ${this.tableName}.min_stock_level`);
      countQuery = countQuery.whereRaw(`${this.tableName}.stock_quantity <= ${this.tableName}.min_stock_level`);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const searchFilter = (builder: any) => {
        builder
          .whereILike(`${this.tableName}.name`, searchTerm)
          .orWhereILike(`${this.tableName}.barcode`, searchTerm)
          .orWhereILike(`${this.tableName}.category`, searchTerm);
      };
      query = query.where(searchFilter);
      countQuery = countQuery.where(searchFilter);
    }

    // Join users for created_by_name
    query = query.leftJoin('users', `${this.tableName}.created_by`, 'users.id');

    // Satis adedine gore siralama
    if (sortBy === 'total_sold') {
      const subquery = this.knex('sale_items as si')
        .join('sales as s', 'si.sale_id', 's.id')
        .where('s.status', 'completed')
        .select('si.product_id')
        .sum('si.quantity as total_sold')
        .groupBy('si.product_id')
        .as('sold_agg');

      query = query
        .leftJoin(subquery, `sold_agg.product_id`, `${this.tableName}.id`)
        .select(`${this.tableName}.*`, 'users.name as created_by_name', this.knex.raw('COALESCE(sold_agg.total_sold, 0) as total_sold'))
        .orderBy('total_sold', sortOrder);
    } else {
      query = query.select(`${this.tableName}.*`, 'users.name as created_by_name').orderBy(`${this.tableName}.${sortBy}`, sortOrder);
    }

    const [items, [{ count }]] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count(`${this.tableName}.id as count`),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.query.where('barcode', barcode).first() || null;
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.query.clone()
      .leftJoin('users', `${this.tableName}.created_by`, 'users.id')
      .select(`${this.tableName}.*`, 'users.name as created_by_name')
      .where(`${this.tableName}.id`, id)
      .first() || null;
  }

  async createProduct(data: CreateProductDto, userId?: string): Promise<Product> {
    const insertData = this.getInsertData({ ...data, created_by: userId || null });
    const [product] = await this.knex(this.tableName).insert(insertData).returning('*');
    return product;
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product | null> {
    const [product] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return product || null;
  }

  async updateStock(id: string, quantity: number, trx?: Knex.Transaction): Promise<void> {
    const baseQuery = trx ? trx(this.tableName) : this.knex(this.tableName);
    const query = this.applyTenantFilter(baseQuery);
    await query.where('id', id).update({
      stock_quantity: this.knex.raw('stock_quantity + ?', [quantity]),
      updated_at: this.knex.fn.now(),
    });
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ is_active: false, updated_at: this.knex.fn.now() });
    return result > 0;
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.query
      .whereRaw('stock_quantity <= min_stock_level')
      .where('is_active', true)
      .orderBy('stock_quantity', 'asc')
      .select('*');
  }

  async getCategories(): Promise<string[]> {
    const results = await this.query
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category');
    return results.map((r) => r.category);
  }

  async getProductSalesWithItems(productId: string): Promise<any[]> {
    const baseQuery = this.knex('sale_items')
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

    return this.applyTenantFilter(baseQuery, 'sales');
  }

  async getProductReturns(productId: string): Promise<any[]> {
    const baseQuery = this.knex('return_items')
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

    return this.applyTenantFilter(baseQuery, 'returns');
  }

  async getProductStockMovements(productId: string): Promise<any[]> {
    const baseQuery = this.knex('stock_movements')
      .leftJoin('warehouses', 'stock_movements.warehouse_id', 'warehouses.id')
      .where('stock_movements.product_id', productId)
      .orderBy('stock_movements.movement_date', 'desc')
      .select(
        'stock_movements.*',
        'warehouses.name as warehouse_name'
      );

    return this.applyTenantFilter(baseQuery, 'stock_movements');
  }

  async getWarehouseStocks(productId: string): Promise<{ warehouse_id: string; warehouse_name: string; quantity: number }[]> {
    const baseQuery = this.knex('warehouse_stocks')
      .leftJoin('warehouses', 'warehouse_stocks.warehouse_id', 'warehouses.id')
      .where('warehouse_stocks.product_id', productId)
      .select(
        'warehouse_stocks.warehouse_id',
        'warehouses.name as warehouse_name',
        'warehouse_stocks.quantity',
      )
      .orderBy('warehouses.name', 'asc');

    return this.applyTenantFilter(baseQuery, 'warehouse_stocks');
  }

  async getProductStats(productId: string): Promise<{
    totalSold: number;
    totalReturned: number;
    totalRevenue: number;
    salesCount: number;
    returnsCount: number;
  }> {
    const salesBaseQuery = this.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sale_items.product_id', productId)
      .where('sales.status', 'completed')
      .select(
        this.knex.raw('COALESCE(SUM(sale_items.quantity), 0) as total_quantity'),
        this.knex.raw('COALESCE(SUM(sale_items.line_total), 0) as total_revenue'),
        this.knex.raw('COUNT(DISTINCT sale_items.sale_id) as sales_count')
      );

    const [salesStats] = await this.applyTenantFilter(salesBaseQuery, 'sales') as { total_quantity: string; total_revenue: string; sales_count: string }[];

    const returnsBaseQuery = this.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .where('return_items.product_id', productId)
      .where('returns.status', 'completed')
      .select(
        this.knex.raw('COALESCE(SUM(return_items.quantity), 0) as total_quantity'),
        this.knex.raw('COUNT(DISTINCT return_items.return_id) as returns_count')
      );

    const [returnsStats] = await this.applyTenantFilter(returnsBaseQuery, 'returns') as { total_quantity: string; returns_count: string }[];

    return {
      totalSold: parseInt(salesStats?.total_quantity || '0', 10),
      totalReturned: parseInt(returnsStats?.total_quantity || '0', 10),
      totalRevenue: parseFloat(salesStats?.total_revenue || '0'),
      salesCount: parseInt(salesStats?.sales_count || '0', 10),
      returnsCount: parseInt(returnsStats?.returns_count || '0', 10),
    };
  }
}
