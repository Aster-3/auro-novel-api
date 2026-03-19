import * as z from "zod";

export const paramsNovelIdSchema = z.object({
  params: z.object({
    novelId: z.uuid("Geçerli bir novel id'si giriniz"),
  }),
});
