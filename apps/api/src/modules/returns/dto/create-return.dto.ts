import { IsString, IsOptional, IsNumber, IsArray, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReturnItemDto {
  @IsUUID()
  product_id: string;

  @IsOptional()
  @IsUUID()
  sale_item_id?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  vat_rate?: number;
}

export class CreateReturnDto {
  @IsOptional()
  @IsUUID()
  sale_id?: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  reason?: string;
}
