import * as z from "zod";

export const userLoginSchema = z.object({
  body: z.object({
    email: z.email("Geçersiz e-posta adresi"),
    password: z
      .string("Şifre alanı zorunludur")
      .min(8, "Şifre en az 8 karakter olmalıdır"),
  }),
});

export type UserLoginDto = z.infer<typeof userLoginSchema>["body"];
