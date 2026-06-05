import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStockCountDto {
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
