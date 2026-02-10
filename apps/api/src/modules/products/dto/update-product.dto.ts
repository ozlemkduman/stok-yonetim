import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  purchase_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sale_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vat_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock_level?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
