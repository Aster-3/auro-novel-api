import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const reorderEditorPicksSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: reqUuid("Editor secimi id"),
          orderIndex: z.coerce.number().int().min(0),
        }),
      )
      .min(1, "En az bir editor secimi siralamasi gondermelisiniz."),
  }),
});

export type ReorderEditorPicksDto = z.infer<
  typeof reorderEditorPicksSchema
>["body"];
