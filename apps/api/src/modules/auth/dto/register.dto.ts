import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Şirket adı gereklidir' })
  @MinLength(2, { message: 'Şirket adı en az 2 karakter olmalıdır' })
  @MaxLength(255, { message: 'Şirket adı en fazla 255 karakter olabilir' })
  companyName: string;

  @IsString({ message: 'Ad soyad gereklidir' })
  @MinLength(2, { message: 'Ad soyad en az 2 karakter olmalıdır' })
  @MaxLength(255, { message: 'Ad soyad en fazla 255 karakter olabilir' })
  name: string;

  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @IsString({ message: 'Şifre gereklidir' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
