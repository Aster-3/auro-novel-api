import * as z from "zod";

export const getUserFollowsSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz kullanici ID'si"),
  }),
  query: z.object({
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmali")
      .max(100, "Tek seferde en fazla 100 kayit cekebilirsiniz")
      .optional()
      .default(20),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarasi 1'den kucuk olamaz")
      .optional()
      .default(1),
  }),
});

export type GetUserFollowsQuery = z.infer<
  typeof getUserFollowsSchema
>["query"];
