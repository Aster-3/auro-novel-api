import * as z from "zod";

export const getSimilarNovelsSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz ID formati"),
  }),
  query: z.object({
    limit: z.coerce
      .number()
      .int("Limit tam sayi olmali")
      .min(1, "Limit en az 1 olmali")
      .max(20, "Benzer seriler icin en fazla 20 kayit cekebilirsiniz")
      .optional()
      .default(10),
  }),
});

export type GetSimilarNovelsDto = z.infer<
  typeof getSimilarNovelsSchema
>["params"] &
  z.infer<typeof getSimilarNovelsSchema>["query"];
