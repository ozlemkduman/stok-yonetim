import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

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
  @IsBoolean()
  is_default?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
