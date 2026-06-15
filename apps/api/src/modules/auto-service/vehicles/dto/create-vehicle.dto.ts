import { IsString, IsOptional, IsUUID, IsInt, IsBoolean, MaxLength, MinLength, Min, Max } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate: string;

  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  model_year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  engine_no?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  fuel_type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
