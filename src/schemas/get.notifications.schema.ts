import * as z from "zod";

export const getNotificationsSchema = z.object({
  query: z.object({
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

export type GetNotificationsDto = z.infer<
  typeof getNotificationsSchema.shape.query
> & {
  userId: string;
};
