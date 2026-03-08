import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";
import { SeriesStatus } from "../constants/series.constants.js";

export const createNovelSchema = z.object({
  body: z.object({
    name: reqString("Kitap adı")
      .min(6, "Kitap adı en az 6 karakter olmalıdır")
      .max(150, "Kitap adı en fazla 150 karakter olmalıdır"),
    slug: reqString("Slug")
      .min(5, "Slug en az 5 karakter olmalıdır")
      .max(50, "Slug en fazla 50 karakter olmalıdır"),
    synopsis: reqString("Kitap açıklaması")
      .min(20, "Kitap açıklaması en az 2 karakter olmalıdır")
      .max(700, "Kitap açıklaması en fazla 700 karakter olmalıdır")
      .optional(),
    authorId: reqUuid("Yazar id"),
    coverImage: reqString("Kitap resmi")
      .min(2, "Kitap resmi en az 2 karakter olmalıdır")
      .max(255, "Kitap resmi en fazla 255 karakter olmalıdır")
      .optional(),
    status: z
      .enum(
        [SeriesStatus.DRAFT],
        "Kitap yayınlanmadan önce taslak olarak kaydedilmelidir.",
      )
      .optional(),
  }),
});

export type CreateNovelDTo = z.infer<typeof createNovelSchema>["body"];
