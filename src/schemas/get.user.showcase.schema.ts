import * as z from "zod";
import { LibrarySortOption } from "../constants/series.constants.js";

const paginationQuery = {
  page: z.coerce
    .number()
    .min(1, "Sayfa numarasi 1'den kucuk olamaz")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit en az 1 olmali")
    .max(100, "Tek seferde en fazla 100 kayit cekebilirsiniz")
    .optional()
    .default(20),
};

export const getUserShowcaseSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz kullanici ID'si"),
  }),
  query: z.object(paginationQuery),
});

export const getUserLibraryShowcaseSchema = z.object({
  params: z.object({
    id: z.uuid("Gecersiz kullanici ID'si"),
  }),
  query: z.object({
    ...paginationQuery,
    sortBy: z
      .enum(LibrarySortOption, "Siralama option parametresi gecersiz.")
      .optional(),
  }),
});

export type GetUserShowcaseDto = z.infer<
  typeof getUserShowcaseSchema.shape.params
> &
  z.infer<typeof getUserShowcaseSchema.shape.query> & {
    userId: string;
  };

export type GetUserLibraryShowcaseDto = z.infer<
  typeof getUserLibraryShowcaseSchema.shape.params
> &
  z.infer<typeof getUserLibraryShowcaseSchema.shape.query> & {
    userId: string;
  };
