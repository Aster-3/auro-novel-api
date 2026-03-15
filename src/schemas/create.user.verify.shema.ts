import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createVerificationSchema = z.object({
  body: z.object({
    userId: reqUuid("Kullanıcı Id"),
    code: reqString("Doğrulama Kodu")
      .length(6, { message: "Doğrulama kodu tam olarak 6 haneli olmalıdır." })
      .regex(/^\d+$/, "Doğrulama kodu sadece rakamlardan oluşmalıdır."),
    expiry: z.date("Geçersiz tarih formatı."),
  }),
});

export type CreateVerificationDto = z.infer<
  typeof createVerificationSchema
>["body"];
