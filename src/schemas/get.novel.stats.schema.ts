import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const getNovelStatsSchema = z.object({
  params: z.object({
    novelId: reqUuid("Novel ID"),
  }),
  query: z.object({
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 7))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "Limit pozitif bir sayı olmalıdır",
      }),
  }),
});
