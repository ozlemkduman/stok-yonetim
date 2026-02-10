import { IsString, IsOptional, IsNumber, IsBoolean, IsIn, MinLength, MaxLength, Min } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsIn(['kasa', 'banka'])
  account_type: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bank_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(34)
  iban?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  account_number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  branch_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string = 'TRY';

  @IsOptional()
  @IsNumber()
  @Min(0)
  opening_balance?: number = 0;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean = false;
}
