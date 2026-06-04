import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, ArrayMinSize, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOpeningStockItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_cost: number;
}

export class CreateOpeningStockDto {
  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOpeningStockItemDto)
  items: CreateOpeningStockItemDto[];

  @IsOptional()
  @IsDateString()
  entry_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
