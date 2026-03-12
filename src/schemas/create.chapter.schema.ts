import * as z from "zod";
import { reqNumber, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createChapterSchema = z.object({
  body: z.object(
    {
      title: reqString("Bölüm başlığı")
        .min(1, "Başlık boş olamaz")
        .max(200, "Başlık en fazla 200 karakter olabilir"),
      content: reqString("Bölüm içeriği").max(
        50000,
        "İçerik en fazla 50000 kar    akter olabilir",
      ),
      order: reqNumber("Bölüm sırası").min(
        1,
        "Sıra 1 veya daha büyük olmalıdır",
      ),
      novelId: reqUuid("Roman Id"),
      volumeId: reqUuid("Cilt Id").nullable(),
    },
    "Body verisi geçersiz.",
  ),
});

export type CreateChapterDTO = z.infer<typeof createChapterSchema>["body"];
