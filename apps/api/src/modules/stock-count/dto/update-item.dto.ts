import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockCountItemDto {
  @IsNumber()
  @Min(0)
  counted_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
