import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createChapterSchema = z.object({
  body: z.object(
    {
      title: reqString("Bölüm başlığı")
        .min(1, "Başlık boş olamaz")
        .max(200, "Başlık en fazla 200 karakter olabilir"),
      content: reqString("Bölüm içeriği").max(
        50000,
        "İçerik en fazla 50000 karakter olabilir",
      ),
      novelId: reqUuid("Roman Id"),
      volumeId: reqUuid("Cilt Id").optional(),
      orderIndex: z
        .number()
        .min(0, "Sıra 0 veya daha büyük olmalıdır")
        .optional(),
    },
    "Body verisi geçersiz.",
  ),
});

export type CreateChapterDTO = z.infer<typeof createChapterSchema>["body"] & {};
