import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const createPublicationSchema = z.object({
  params: z.object({
    id: reqUuid("Bölüm Id"),
  }),
  body: z.object(
    {
      orderIndex: z
        .number()
        .min(0, "Sıra 0 veya daha büyük olmalıdır")
        .optional(),
      volumeId: reqUuid("Cilt Id").optional(),
      novelId: reqUuid("Roman Id"),
    },
    "Body verisi geçersiz.",
  ),
});

export type CreatePublicationDTO = z.infer<
  typeof createPublicationSchema.shape.body
> &
  z.infer<typeof createPublicationSchema.shape.params>;
