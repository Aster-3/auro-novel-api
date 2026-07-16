import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const reorderBannersSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: reqUuid("Banner id"),
          orderIndex: z.coerce.number().int().min(0),
        }),
      )
      .min(1, "En az bir banner siralamasi gondermelisiniz."),
  }),
});

export type ReorderBannersDto = z.infer<typeof reorderBannersSchema>["body"];
