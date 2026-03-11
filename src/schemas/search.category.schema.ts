import * as z from "zod";
import { LanguageType } from "../constants/series.constants.js";

export const searchCategorySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    lang: z.enum(LanguageType, "Geçersiz dil").optional(),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarası 1'den küçük olamaz")
      .optional()
      .default(1),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalıdır.")
      .max(100, "Tek seferde en fazla 100 kayıt çekebilirsiniz.")
      .optional()
      .default(20),
  }),
});

export type SearchCategoryDto = z.infer<typeof searchCategorySchema>["query"];
