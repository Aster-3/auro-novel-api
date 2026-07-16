import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: reqString("Mevcut sifre").min(
      8,
      "Mevcut sifre en az 8 karakter olmalidir",
    ),
    newPassword: reqString("Yeni sifre")
      .min(8, "Yeni sifre en az 8 karakter olmalidir")
      .max(255, "Yeni sifre en fazla 255 karakter olmalidir"),
  }),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>["body"];
