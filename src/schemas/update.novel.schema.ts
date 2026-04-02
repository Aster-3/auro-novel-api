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
    synopsis: reqString("Özet")
      .max(1500, "Özet 1500 karakteri geçemez")
      .nullable()
      .optional(),
    status: z.enum(SeriesStatus).optional(),
    categories: z
      .array(
        z.coerce.number(),
        "Kategori idleri zorunludur ve sayı formatında olmalıdır.",
      )
      .max(3, "En fazla 3 kategori seçebilirsiniz.")
      .optional(),
    tags: z
      .array(
        z.coerce.string(),
        "Etiket idleri zorunludur ve string formatında olmalıdır.",
      )
      .max(20, "En fazla 20 etiket seçebilirsiniz.")
      .optional(),
  }),
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});

export type UpdateNovelDTO = z.infer<typeof updateNovelSchema.shape.body> &
  z.infer<typeof updateNovelSchema.shape.params> & {
    coverImage?: any;
  };
