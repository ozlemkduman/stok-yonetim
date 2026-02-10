import { IsString, IsOptional, IsNumber, IsIn, IsDateString, Min } from 'class-validator';

export class CreateMovementDto {
  @IsIn(['gelir', 'gider'])
  movement_type: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  reference_type?: string;

  @IsOptional()
  @IsString()
  reference_id?: string;

  @IsOptional()
  @IsDateString()
  movement_date?: string;
}
