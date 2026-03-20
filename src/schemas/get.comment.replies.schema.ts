import * as z from "zod";

export const getCommentRepliesSchema = z.object({
  params: z.object({
    id: z.coerce.number().min(1, "Yorum id'si geçersiz"),
  }),
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

export type GetCommentRepliesDto = z.infer<
  typeof getCommentRepliesSchema.shape.params
> &
  z.infer<typeof getCommentRepliesSchema.shape.query> & {
    userId?: string;
  };
