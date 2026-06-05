import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class DemoApplicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  @IsNotEmpty({ message: 'E-posta zorunlu' })
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
