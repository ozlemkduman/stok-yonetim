import { IsString, IsOptional, IsUUID, IsNumber, IsIn } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  quantity: number;

  @IsIn(['add', 'subtract', 'set'])
  adjustment_type: 'add' | 'subtract' | 'set';

  @IsOptional()
  @IsString()
  notes?: string;
}
