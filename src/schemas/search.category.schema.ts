import * as z from "zod";

export const searchCategorySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarasi 1'den kucuk olamaz")
      .optional()
      .default(1),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalidir.")
      .max(100, "Tek seferde en fazla 100 kayit cekebilirsiniz.")
      .optional()
      .default(20),
  }),
});

export type SearchCategoryDto = z.infer<typeof searchCategorySchema>["query"];
