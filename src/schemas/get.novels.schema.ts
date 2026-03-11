import * as z from "zod";
import { SeriesStatus } from "../constants/series.constants.js";

export const getNovelsSchema = z.object({
  query: z.object({
    name: z.string().optional(),
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
    status: z
      .enum(SeriesStatus, "Seri durumu parametresi geçersiz.")
      .optional(),
  }),
});

export type GetNovelsDTo = z.infer<typeof getNovelsSchema>["query"];
