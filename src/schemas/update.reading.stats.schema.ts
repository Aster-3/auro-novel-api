import * as z from "zod";

export const updateReadingStatsSchema = z.object({
  body: z.object({
    novelId: z.uuid({ message: "Geçersiz novel ID'si" }),
    lastReadChapterId: z.uuid({ message: "Geçersiz chapter ID'si" }),
    lastChapterProgress: z
      .number()
      .min(0, { message: "Progress 0'dan küçük olamaz" })
      .max(100, { message: "Progress 100'den büyük olamaz" }),
    incrementTime: z
      .number()
      .min(0, { message: "Read time 0'dan küçük olamaz" }),
  }),
});

export type UpdateReadingStatsDto = z.infer<
  typeof updateReadingStatsSchema
>["body"] & {
  userId: string;
};
