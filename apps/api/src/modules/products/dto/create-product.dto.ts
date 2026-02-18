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

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

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
  unit?: string = 'adet';

  @IsNumber()
  @Min(0)
  purchase_price: number;

  @IsNumber()
  @Min(0)
  sale_price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesale_price?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  vat_rate?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock_quantity?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_stock_level?: number = 5;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
