import * as z from "zod";

export const getCommentsSchema = z.object({
  params: z.object({
    id: z.uuid("Geçerli bir novel id'si giriniz"),
  }),
  query: z.object({
    page: z.coerce
      .number()
      .min(1, "Sayfa numarası 1'den küçük olamaz")
      .optional()
      .default(1),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalı")
      .max(100, "Tek seferde en fazla 100 kayıt çekebilirsiniz")
      .optional()
      .default(20),
  }),
});

export type GetCommentsDto = z.infer<typeof getCommentsSchema.shape.params> &
  z.infer<typeof getCommentsSchema.shape.query>;
