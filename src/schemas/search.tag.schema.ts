import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const searchTagSchema = z.object({
  query: z.object({
    name: reqString("Etiket adı")
      .min(3, "Etiket adı en az 3 karakter olmalıdır")
      .max(30, "Etiket adı en fazla 30 karakter olmalıdır")
      .optional(),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalı")
      .max(100, "Tek seferde en fazla 100 kayıt çekebilirsiniz")
      .optional()
      .default(20),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarası 1'den küçük olamaz")
      .optional()
      .default(1),
  }),
});

export type SearchTagDto = z.infer<typeof searchTagSchema>["query"];
