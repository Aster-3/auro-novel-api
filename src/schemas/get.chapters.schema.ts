import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const getChaptersSchema = z.object({
  params: z.object({
    id: reqUuid("Roman Id"),
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

export type GetChaptersDto = z.infer<typeof getChaptersSchema.shape.params> &
  z.infer<typeof getChaptersSchema.shape.query> & {
    userId?: string;
  };
