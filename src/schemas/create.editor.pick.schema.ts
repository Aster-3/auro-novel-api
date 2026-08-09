import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

const booleanFromFormData = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const createEditorPickSchema = z.object({
  body: z.object({
    novelId: reqUuid("Roman id"),
    orderIndex: z.coerce.number().int().min(0).optional().default(0),
    isActive: booleanFromFormData.optional().default(true),
  }),
});

export type CreateEditorPickDto = z.infer<
  typeof createEditorPickSchema
>["body"];
