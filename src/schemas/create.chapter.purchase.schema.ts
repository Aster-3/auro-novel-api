import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";
import { CoinType } from "../constants/transaction.contants.js";

export const createChapterPurchaseSchema = z.object({
  params: z.object({
    id: reqUuid("Bölüm ID'si"),
  }),
  body: z.object({
    coinType: z.enum(CoinType, { message: "Geçersiz coin türü" }),
  }),
});

export type CreateChapterPurchaseDTO = z.infer<
  typeof createChapterPurchaseSchema
>["body"] &
  z.infer<typeof createChapterPurchaseSchema>["params"] & {
    userId: string;
  };
