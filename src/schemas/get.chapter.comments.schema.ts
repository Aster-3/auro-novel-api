import * as z from "zod";

export const getChapterCommentsSchema = z.object({
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
  params: z.object({
    chapterId: z.uuid("Gecerli bir chapter id'si giriniz").optional(),
    commentId: z.coerce
      .number()
      .min(1, "Yorum id 1'den buyuk olmalidir")
      .optional(),
  }),
});

export type GetChapterCommentsDto = z.infer<
  typeof getChapterCommentsSchema
>["query"] & {
  chapterId?: string;
};
