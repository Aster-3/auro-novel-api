import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createNovelSchema = z.object({
  body: z.object({
    name: reqString("Kitap adı")
      .min(4, "Kitap adı en az 4 karakter olmalıdır")
      .max(100, "Kitap adı en fazla 100 karakter olmalıdır"),
    slug: reqString("Slug")
      .min(4, "Slug en az 4 karakter olmalıdır")

      .max(150, "Slug en fazla 150 karakter olmalıdır")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug sadece küçük harf, sayı ve tire (-) içerebilir",
      ),
    authorId: reqUuid("Yazar id").optional(),
  }),
});

export type CreateNovelDTo = z.infer<typeof createNovelSchema>["body"] & {
  coverImage?: string;
};
