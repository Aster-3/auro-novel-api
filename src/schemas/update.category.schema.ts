import * as z from "zod";
import { reqNumber, reqString } from "../utils/zod.error.helper.js";

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.preprocess((val) => Number(val), reqNumber("Kategori id'si")),
  }),
  body: z
    .object({
      trName: reqString("Türkçe kategori adı").optional(),
      enName: reqString("İngilizce kategori adı").optional(),
      coverUrl: z.string().url("Geçerli bir URL giriniz").optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message:
        "En az bir alanı (trName, enName veya coverUrl) güncellemelisiniz.",
    }),
});

export type UpdateCategoryDto = z.infer<
  typeof updateCategorySchema.shape.params
> &
  z.infer<typeof updateCategorySchema.shape.body>;
