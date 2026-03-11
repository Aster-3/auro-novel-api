import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const updateTagsSchema = z.object({
  body: z.object({
    tags: z
      .array(reqUuid("Etiket id"), "Etiket id'leri zorunludur.")
      .max(10, "En fazla 10 etiket seçebilirsiniz."),
  }),
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});
