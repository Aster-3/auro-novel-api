import * as z from "zod";
import { reqNumber, reqString } from "../utils/zod.error.helper.js";

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.preprocess((val) => Number(val), reqNumber("Kategori id'si")),
  }),
  body: z
    .object({
      title: reqString("Kategori basligi")
        .min(1, "Kategori basligi bos birakilamaz")
        .max(30, "Kategori basligi en fazla 30 karakter olabilir")
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "En az bir alan guncellemelisiniz.",
    }),
});

export type UpdateCategoryDto = z.infer<
  typeof updateCategorySchema.shape.params
> &
  z.infer<typeof updateCategorySchema.shape.body>;
