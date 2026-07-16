import * as z from "zod";

export const getTagNovelsSchema = z.object({
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
  query: z.object({
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

export type GetTagNovelsDto = z.infer<typeof getTagNovelsSchema>["query"] &
  z.infer<typeof getTagNovelsSchema>["params"];
