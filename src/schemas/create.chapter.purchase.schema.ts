import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const createChapterPurchaseSchema = z.object({
  body: z.object({
    chapterId: reqUuid("Bölüm ID'si"),
    userId: reqUuid("Kullanıcı ID'si"),
  }),
});

export type CreateChapterPurchaseDTO = z.infer<
  typeof createChapterPurchaseSchema
>["body"];
