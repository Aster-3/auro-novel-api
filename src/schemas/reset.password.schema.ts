import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.email("Gecersiz e-posta adresi"),
    code: reqString("Sifre sifirlama kodu")
      .length(6, {
        message: "Sifre sifirlama kodu tam olarak 6 haneli olmalidir.",
      })
      .regex(/^\d+$/, "Sifre sifirlama kodu sadece rakamlardan olusmalidir."),
    newPassword: reqString("Yeni sifre")
      .min(8, "Yeni sifre en az 8 karakter olmalidir")
      .max(255, "Yeni sifre en fazla 255 karakter olmalidir"),
  }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>["body"];
