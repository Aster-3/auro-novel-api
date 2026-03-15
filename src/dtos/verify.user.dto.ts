import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from "class-validator";

export class CreateUserDto {
  @MinLength(4, { message: "Kullanıcı adı en az 4 karakter olabilir." })
  @MaxLength(15, { message: "Kullanıcı adı en fazla 15 karakter olabilir." })
  @IsString({ message: "Kullanıcı adı bir string olmalıdır." })
  @IsNotEmpty({ message: "Kullanıcı adı alanı zorunludur.." })
  username!: string;

  @MinLength(4, { message: "Nickname en az 4 karakter olabilir." })
  @MaxLength(20, { message: "Nickname en fazla 20 karakter olabilir." })
  @IsString({ message: "Nickname bir string olmalıdır." })
  @IsNotEmpty({ message: "Nickname alanı zorunludur." })
  nickname!: string;

  @IsEmail({}, { message: "Geçersiz e-posta formatı." })
  @IsNotEmpty({ message: "E-posta alanı zorunludur." })
  email!: string;

  @MaxLength(255, { message: "Şifre en fazla 255 karakter olabilir." })
  @MinLength(8, { message: "Şifre en az 8 karakter olabilir." })
  @IsString({ message: "Şifre bir metin olmalıdır." })
  @IsNotEmpty({ message: "Şifre alanı zorunludur." })
  password!: string;

  @IsOptional()
  @IsString({ message: "Doğrulama kodu bir string olmalıdır." })
  verificationCode!: string | null;

  @IsOptional()
  verificationCodeExpiry?: Date;
}
