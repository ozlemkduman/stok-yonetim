import { IsString, IsUUID, IsIn, IsOptional } from 'class-validator';

export class CreateEDocumentDto {
  @IsIn(['e_fatura', 'e_arsiv', 'e_ihracat', 'e_irsaliye', 'e_smm'])
  document_type: string;

  @IsIn(['sale', 'return', 'waybill'])
  reference_type: string;

  @IsUUID()
  reference_id: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
