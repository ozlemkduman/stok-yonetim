import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateTransferDto {
  @IsUUID()
  from_warehouse_id: string;

  @IsUUID()
  to_warehouse_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  transfer_date?: string;
}
