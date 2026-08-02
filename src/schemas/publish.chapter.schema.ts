import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const createPublicationSchema = z.object({
  params: z.object({
    id: reqUuid("Bolum Id"),
  }),
  body: z.object(
    {
      volumeId: reqUuid("Cilt Id").optional(),
      novelId: reqUuid("Roman Id"),
    },
    "Body verisi gecersiz.",
  ),
});

export type CreatePublicationDTO = z.infer<
  typeof createPublicationSchema.shape.body
> &
  z.infer<typeof createPublicationSchema.shape.params>;
