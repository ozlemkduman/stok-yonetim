import { IsString, IsOptional, IsNumber, IsUUID, IsDateString, IsIn, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  customer_id: string;

  @IsOptional()
  @IsUUID()
  sale_id?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsIn(['nakit', 'kredi_karti', 'havale'])
  method: string;

  @IsOptional()
  @IsDateString()
  payment_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
