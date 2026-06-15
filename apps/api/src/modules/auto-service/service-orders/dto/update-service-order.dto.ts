import { IsString, IsOptional, IsUUID, IsInt, IsNumber, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SERVICE_ORDER_STATUSES, ServiceOrderItemDto } from './create-service-order.dto';

export class UpdateServiceOrderDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

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
