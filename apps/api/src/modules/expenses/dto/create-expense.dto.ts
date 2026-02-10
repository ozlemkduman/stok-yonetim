import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsIn, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  @IsIn(['kira', 'vergi', 'maas', 'fatura', 'diger'])
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  expense_date: string;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean = false;

  @IsOptional()
  @IsString()
  @IsIn(['aylik', 'yillik'])
  recurrence_period?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @IsIn(['kira', 'vergi', 'maas', 'fatura', 'diger'])
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  expense_date?: string;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['aylik', 'yillik'])
  recurrence_period?: string;
}
