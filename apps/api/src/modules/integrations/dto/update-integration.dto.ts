import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class UpdateIntegrationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'error'])
  status?: 'active' | 'inactive' | 'error';

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;
}
