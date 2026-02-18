import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsUUID, IsDateString, Min, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_rate?: number = 0;
}

export class CreateSaleDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsDateString()
  sale_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_rate?: number = 0;

  @IsOptional()
  @IsBoolean()
  include_vat?: boolean = true;

  @IsString()
  @IsIn(['nakit', 'kredi_karti', 'havale', 'veresiye'])
  payment_method: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['retail', 'wholesale'])
  sale_type?: string = 'retail';

  @IsOptional()
  @IsString()
  notes?: string;
}
