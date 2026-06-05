import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class UpdateChequeStatusDto {
  @IsString()
  @IsIn(['in_portfolio', 'collected', 'cashed_out', 'bounced', 'returned'])
  status: string;

  // Hangi hesaba/kasaya yansısın? Sadece 'collected' / 'cashed_out' için anlamlı.
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
