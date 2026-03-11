import * as z from "zod";

export const paramsUuidSchema = z.object({
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});
