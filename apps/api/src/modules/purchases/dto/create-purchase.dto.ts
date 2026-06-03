import { IsString, IsOptional, IsUUID, IsNumber, IsIn, IsBoolean, IsArray, ValidateNested, ArrayMinSize, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_rate?: number;
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_rate?: number;

  @IsOptional()
  @IsBoolean()
  include_vat?: boolean;

  @IsString()
  @IsIn(['nakit', 'kredi_karti', 'havale', 'veresiye'])
  payment_method: string;

  @IsOptional()
  @IsDateString()
  purchase_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  supplier_invoice_no?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
