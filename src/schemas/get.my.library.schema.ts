import * as z from "zod";
import { LibrarySortOption } from "../constants/series.constants.js";

export const getMyLibrarySchema = z.object({
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
    sortBy: z
      .enum(LibrarySortOption, "Siralama option parametresi gecersiz.")
      .optional(),
    search: z.string().trim().optional(),
  }),
});

export type GetMyLibraryDto = z.infer<typeof getMyLibrarySchema>["query"] & {
  userId: string;
};
