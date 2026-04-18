import * as z from "zod";
import { LibrarySortOption } from "../constants/series.constants.js";

export const getMyLibrarySchema = z.object({
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
    sortBy: z
      .enum(LibrarySortOption, "Sıralama option parametresi geçersiz.")
      .optional(),
  }),
});

export type GetMyLibraryDto = z.infer<typeof getMyLibrarySchema>["query"] & {
  userId: string;
};
