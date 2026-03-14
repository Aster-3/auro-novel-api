import * as z from "zod";

import { SeriesStatus } from "../constants/series.constants.js";
import { reqNumber, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const updateNovelSchema = z.object({
  body: z.object({
    name: reqString("Roman adı")
      .min(2, "Roman adı çok kısa")
      .max(150, "Roman adı en fazla 150 karakter olabilir")
      .optional(),
    slug: reqString("Slug")
      .min(5, "Slug en az 5 karakter olmalıdır")
      .max(50, "Slug en fazla 50 karakter olmalıdır")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug sadece küçük harf, sayı ve tire (-) içerebilir",
      )
      .optional(),
    coverImage: z
      .url("Geçerli bir kapak resmi linki giriniz")
      .nullable()
      .optional(),
    synopsis: reqString("Özet")
      .max(1500, "Özet 1500 karakteri geçemez")
      .nullable()
      .optional(),
    status: z.enum(SeriesStatus).optional(),

    // İlişkisel alanlar (Genelde ID listesi olarak alınır)
    categories: z
      .array(reqNumber("Kategori id"), "Kategori idleri zorunludur.")
      .max(3, "En fazla 3 kategori seçebilirsiniz.")
      .optional(),
    tags: z
      .array(reqUuid("Etiket id"), "Etiket idleri zorunludur.")
      .max(20, "En fazla 20 etiket seçebilirsiniz.")
      .optional(),
  }),
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});

export type UpdateNovelDTO = z.infer<typeof updateNovelSchema.shape.body> &
  z.infer<typeof updateNovelSchema.shape.params>;
