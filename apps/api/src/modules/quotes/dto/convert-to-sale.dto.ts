import { IsString, IsOptional, IsUUID, IsIn, IsDateString } from 'class-validator';

export class ConvertToSaleDto {
  @IsIn(['nakit', 'kredi_karti', 'havale', 'veresiye'])
  payment_method: string;

  @IsOptional()
  @IsUUID()
  warehouse_id?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
