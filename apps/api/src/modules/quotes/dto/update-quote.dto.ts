import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsNumber, IsDateString, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteItemDto } from './create-quote.dto';

export class UpdateQuoteDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items?: QuoteItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_rate?: number;

  @IsOptional()
  @IsBoolean()
  include_vat?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
