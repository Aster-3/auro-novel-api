import * as z from "zod";

export const getOneWithUuid = z.object({
  params: z.object({
    id: z.uuid("Geçersiz ID formatı"),
  }),
});
