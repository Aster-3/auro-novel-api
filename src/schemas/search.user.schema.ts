import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const userSearchShema = z.object({
  query: z.object({
    query: reqString("Query"),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarası 1'den küçük olamaz")
      .optional()
      .default(1),
  }),
});
