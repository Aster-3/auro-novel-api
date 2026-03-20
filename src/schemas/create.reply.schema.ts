import * as z from "zod";
import { reqNumber, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createReplySchema = z.object({
  body: z.object({
    content: reqString("Yanıt")
      .min(1, "Yanıt boş bırakılamaz")
      .max(1500, "Yanıt en fazla 1500 karakter olmalıdır"),

    rootCommentId: reqNumber("Root Yorum id").min(
      1,
      "Root Yorum id 1'den büyük olmalıdır",
    ),

    parentReplyId: z.preprocess(
      (val) => (val === "" ? null : val),
      reqNumber("Yanıt id").min(1, "Yanıt id 1'den büyük olmalıdır").nullable(),
    ),
  }),
});

export type CreateReplyDto = z.infer<typeof createReplySchema>["body"];
