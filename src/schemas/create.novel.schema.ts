import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createNovelSchema = z.object({
  body: z.object({
    name: reqString("Kitap adı")
      .min(6, "Kitap adı en az 6 karakter olmalıdır")
      .max(150, "Kitap adı en fazla 150 karakter olmalıdır"),
    slug: reqString("Slug")
      .min(5, "Slug en az 5 karakter olmalıdır")
      .max(50, "Slug en fazla 50 karakter olmalıdır")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug sadece küçük harf, sayı ve tire (-) içerebilir",
      ),
    authorId: reqUuid("Yazar id"),
    coverImage: z.url("Geçerli bir resim linki giriniz").optional(),
  }),
});

export type CreateNovelDTo = z.infer<typeof createNovelSchema>["body"];
