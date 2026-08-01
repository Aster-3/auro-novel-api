import * as z from "zod";

export const updateContentPreferencesSchema = z.object({
  body: z
    .object({
      showAdultContent: z.boolean(),
    })
    .strict(),
});

export type UpdateContentPreferencesDto = z.infer<
  typeof updateContentPreferencesSchema
>["body"];
