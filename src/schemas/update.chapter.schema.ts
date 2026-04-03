import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";
import { wordCounter } from "../utils/wordCounter.js";

export const updateChapterSchema = z.object({
  body: z.object({
    content: z
      .string()
      .max(50000, "İçerik çok uzun (maks. 50.000 karakter)")
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return;

        const count = wordCounter(val);

        if (count < 20) {
          ctx.addIssue({
            code: "custom",
            message: "İçerik en az 20 kelime olmalıdır",
          });
        }

        if (count > 4000) {
          ctx.addIssue({
            code: "custom",
            message: "İçerik en fazla 4000 kelime olabilir",
          });
        }
      }),
    title: z
      .string()
      .min(1, "Başlık boş olamaz")
      .max(200, "Başlık en fazla 200 karakter olabilir")
      .optional(),
  }),
  params: z.object({
    id: reqUuid("Bölüm Id"),
  }),
});

export type UpdateChapterDTO = z.infer<typeof updateChapterSchema.shape.body> &
  z.infer<typeof updateChapterSchema.shape.params>;
