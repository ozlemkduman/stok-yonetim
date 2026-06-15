import { IsString, IsOptional, IsUUID, IsInt, IsNumber, IsIn, Min, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export const SERVICE_ORDER_STATUSES = ['open', 'in_progress', 'completed', 'delivered', 'cancelled'] as const;

export class ServiceOrderItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  vat_rate?: number;
}

export class CreateServiceOrderDto {
  @IsUUID()
  vehicle_id: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceOrderItemDto)
  items?: ServiceOrderItemDto[];

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsUUID()
  assigned_employee_id?: string;

  @IsOptional()
  @IsIn(SERVICE_ORDER_STATUSES as unknown as string[])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage_in?: number;

  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  labor_cost?: number;

  // parts_cost manuel girilmez — service_order_items kalemlerinden hesaplanır.

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
