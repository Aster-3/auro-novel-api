import * as z from "zod";
import { reqNumber, reqString, reqUuid } from "../utils/zod.error.helper.js";
export const createReplySchema = z.object({
  body: z.object({
    content: reqString("Yanıt").max(
      1000,
      "Yanıt en fazla 700 karakter olmalıdır",
    ),
    novelId: reqUuid("Novel id"),
    parentCommentId: reqNumber("Ebeveyn Yorum id"),
    rootCommentId: reqNumber("Kök Yorum id"),
    userId: reqUuid("Kullanıcı id"),
  }),
});

export type CreateReplyDto = z.infer<typeof createReplySchema>["body"];
