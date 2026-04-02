import * as z from "zod";
import { reqFloat, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createVolumeSchema = z.object({
  body: z.object({
    name: reqString("Cilt Adı")
      .max(100, "Cilt adı en fazla 100 karakter olabilir")
      .nullable(),
    orderIndex: reqFloat("Cilt Sırası")
      .min(0, "Sıra 0 veya daha büyük olmalıdır")
      .optional(),
    novelId: reqUuid("Roman Id"),
  }),
});

export type CreateVolumeDTO = z.infer<typeof createVolumeSchema>["body"];
