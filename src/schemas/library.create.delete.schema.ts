import * as z from "zod";

export const libraryCreateDeleteSchema = z.object({
  body: z.object({
    novelId: z.uuid("Geçersiz ID formatı."),
    userId: z.uuid("Geçersiz ID formatı"),
  }),
});
