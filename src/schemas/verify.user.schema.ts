import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const verifyUserSchema = z.object({
  body: z.object({
    email: z.email("Geçersiz e-posta formatı."),
    code: reqString("Doğrulama Kodu")
      .length(6, { message: "Doğrulama kodu tam olarak 6 haneli olmalıdır." })
      .regex(/^\d+$/, "Doğrulama kodu sadece rakamlardan oluşmalıdır."),
  }),
});

export type VerifyUserDto = z.infer<typeof verifyUserSchema>["body"];
