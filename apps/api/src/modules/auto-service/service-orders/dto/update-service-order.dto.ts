import { IsString, IsOptional, IsUUID, IsInt, IsNumber, IsIn, Min } from 'class-validator';
import { SERVICE_ORDER_STATUSES } from './create-service-order.dto';

export class UpdateServiceOrderDto {
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

  @IsOptional()
  @IsNumber()
  @Min(0)
  parts_cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
