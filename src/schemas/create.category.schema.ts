import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const createCategorySchema = z.object({
  body: z.object({
    title: reqString("Kategori basligi")
      .min(1, "Kategori basligi bos birakilamaz")
      .max(30, "Kategori basligi en fazla 30 karakter olabilir"),
  }),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>["body"];
