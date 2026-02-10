import { IsString, IsOptional, IsNumber, IsUUID, IsDateString, Min } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  from_account_id: string;

  @IsUUID()
  to_account_id: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  transfer_date?: string;
}
