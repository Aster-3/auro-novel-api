import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: reqString("Mevcut sifre").min(
        8,
        "Mevcut sifre en az 8 karakter olmalidir",
      ).max(255, "Mevcut sifre en fazla 255 karakter olmalidir"),
      newPassword: reqString("Yeni sifre")
        .min(8, "Yeni sifre en az 8 karakter olmalidir")
        .max(255, "Yeni sifre en fazla 255 karakter olmalidir")
        .regex(/[a-z]/, "Yeni sifre en az bir kucuk harf icermelidir")
        .regex(/[A-Z]/, "Yeni sifre en az bir buyuk harf icermelidir"),
      newPasswordConfirm: reqString("Yeni sifre tekrari")
        .min(8, "Yeni sifre tekrari en az 8 karakter olmalidir")
        .max(255, "Yeni sifre tekrari en fazla 255 karakter olmalidir")
        .regex(/[a-z]/, "Yeni sifre tekrari en az bir kucuk harf icermelidir")
        .regex(/[A-Z]/, "Yeni sifre tekrari en az bir buyuk harf icermelidir"),
    })
    .strict()
    .refine((body) => body.newPassword === body.newPasswordConfirm, {
      path: ["newPasswordConfirm"],
      message: "Yeni sifreler eslesmiyor.",
    }),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>["body"];
