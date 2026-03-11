import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const createCategorySchema = z.object({
  body: z.object({
    trName: reqString("Türkçe kategori adı"),
    enName: reqString("İngilizce kategori adı"),
    coverUrl: z.url("Geçerli bir URL giriniz").optional(),
  }),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>["body"];
