import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsNumber, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsUUID()
  product_id: string;

  @IsString()
  product_name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_rate?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vat_rate?: number = 20;
}

export class CreateQuoteDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsDateString()
  valid_until: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_rate?: number = 0;

  @IsOptional()
  @IsBoolean()
  include_vat?: boolean = true;

  @IsOptional()
  @IsString()
  notes?: string;
}
