import * as z from "zod";
import { reqFloat, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createVolumeSchema = z.object({
  body: z.object({
    name: reqString("Cilt Adı")
      .min(1, "Cilt adı boş olamaz ")
      .max(100, "Cilt adı en fazla 100 karakter olabilir"),
    order: reqFloat("Cilt Sırası")
      .describe("Cilt sırası (float destekli)")
      .min(1, "Sıra 1 veya daha büyük olmalıdır")
      .multipleOf(0.01, "Sıra 0.01'in katları olmalıdır"),
    novelId: reqUuid("Roman Id"),
  }),
});

export type CreateVolumeDTO = z.infer<typeof createVolumeSchema>["body"];
