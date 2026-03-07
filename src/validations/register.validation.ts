import * as z from "zod";

export const registerSchema = z.object({
  username: z
    .string("Kullanıcı adı zorunludur ve bir metin olmalıdır.")
    .min(4, "Kullanıcı adı en az 4 karakter olmalıdır")
    .max(15, "Kullanıcı adı en fazla 15 karakter olmalıdır"),
  nickname: z
    .string("Takma ad zorunludur ve bir metin olmalıdır.")
    .min(4, "Takma ad en az 4 karakter olmalıdır ")
    .max(20, "Takma ad en fazla 20 karakter olmalıdır"),
  email: z.email("Geçersiz e-posta adresi"),
  password: z
    .string("Şifre alanı zorunludur")
    .min(8, "Şifre en az 8 karakter olmalıdır ")
    .max(255, "Şifre en fazla 255 karakter olmalıdır"),
});
