import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const registerSchema = z.object({
  body: z.object({
    username: reqString("Kullanıcı adı")
      .min(4, "Kullanıcı adı en az 4 karakter olmalıdır")
      .max(15, "Kullanıcı adı en fazla 15 karakter olmalıdır")
      .regex(
        /^[a-z0-9_-]+$/,
        "Kullanıcı adı sadece küçük harf, rakam, alt çizgi ve tire içerebilir",
      ),
    nickname: reqString("Takma ad")
      .min(4, "Takma ad en az 4 karakter olmalıdır ")
      .max(20, "Takma ad en fazla 20 karakter olmalıdır"),
    email: z.email("Geçersiz e-posta adresi"),
    password: reqString("Şifre")
      .min(8, "Şifre en az 8 karakter olmalıdır")
      .max(255, "Şifre en fazla 255 karakter olmalıdır")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir"),
  }),
});
