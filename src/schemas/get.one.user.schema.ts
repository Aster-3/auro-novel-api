import * as z from "zod";

export const getOneUserSchema = z.object({
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});
