import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class CreateIntegrationDto {
  @IsString()
  name: string;

  @IsEnum(['e_commerce', 'bank', 'payment', 'crm', 'other'])
  type: 'e_commerce' | 'bank' | 'payment' | 'crm' | 'other';

  @IsEnum([
    'trendyol', 'hepsiburada', 'n11', 'amazon', 'gittigidiyor',
    'akbank', 'isbank', 'garanti', 'yapikredi', 'ziraat',
    'iyzico', 'paytr', 'payu', 'stripe',
    'salesforce', 'hubspot', 'zoho',
    'custom'
  ])
  provider: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;
}
