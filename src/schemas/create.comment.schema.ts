import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createCommentSchema = z.object({
  body: z.object({
    content: reqString("Yorum")
      .min(10, "Yorum en az 10 karakter olmalıdır")
      .max(1500, "Yorum en fazla 1500 karakter olmalıdır"),
    isRecommend: z.boolean("Önerilme durumu zorunludur"),
    userId: reqUuid("User id"),
  }),
  params: z.object({
    novelId: z.uuid("Geçerli bir novel id'si giriniz"),
  }),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>["body"] &
  z.infer<typeof createCommentSchema.shape.params>;
