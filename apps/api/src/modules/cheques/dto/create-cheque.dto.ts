import { IsString, IsOptional, IsUUID, IsNumber, IsIn, Min, IsDateString } from 'class-validator';

export class CreateChequeDto {
  @IsString()
  @IsIn(['cek', 'senet'])
  type: string;

  @IsString()
  @IsIn(['incoming', 'outgoing'])
  direction: string;

  @IsOptional()
  @IsString()
  cheque_number?: string;

  @IsOptional()
  @IsString()
  bank_name?: string;

  @IsOptional()
  @IsString()
  drawer_name?: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
