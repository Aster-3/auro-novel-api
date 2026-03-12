import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const updateChapterSchema = z.object({
  body: z.object({
    content: z
      .string()
      .max(50000, "İçerik en fazla 50000 karakter olabilir")
      .optional(),
    title: z
      .string()
      .min(1, "Başlık boş olamaz")
      .max(200, "Başlık en fazla 200 karakter olabilir")
      .optional(),
    volumeId: reqUuid("Cilt Id").optional(),
    isPublished: z.boolean().optional(),
  }),
  params: z.object({
    id: reqUuid("Bölüm Id"),
  }),
});

export type UpdateChapterDTO = z.infer<typeof updateChapterSchema.shape.body> &
  z.infer<typeof updateChapterSchema.shape.params>;
