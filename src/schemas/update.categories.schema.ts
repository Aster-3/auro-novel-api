import * as z from "zod";
import { reqNumber } from "../utils/zod.error.helper.js";

export const updateCategoriesSchema = z.object({
  body: z.object({
    categories: z
      .array(reqNumber("Kategori id"), "Kategori idleri zorunludur.")
      .max(3, "En fazla 3 kategori seçebilirsiniz."),
  }),
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});
