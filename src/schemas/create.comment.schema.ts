import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createCommentSchema = z.object({
  body: z.object({
    content: reqString("Yorum")
      .min(2, "Yorum en az 2 karakter olmalıdır")
      .max(1000, "Yorum en fazla 1000 karakter olmalıdır"),
    novelId: reqUuid("Novel id"),
    isRecommend: z.boolean("Önerilme durumu zorunludur"),
    userId: reqUuid("User id"),
  }),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>["body"];
