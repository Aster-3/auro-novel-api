import * as z from "zod";
import { reqFloat, reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createVolumeSchema = z.object({
  body: z.object({
    name: reqString("Cilt Adı")
      .max(100, "Cilt adı en fazla 100 karakter olabilir")
      .nullable(),
    order: reqFloat("Cilt Sırası")
      .min(1, "Sıra 1 veya daha büyük olmalıdır")
      .describe("Cilt sırası (Maksimum 1 ondalık)")
      .refine(
        (val) => {
          const decimalStr = val.toString().split(".")[1];
          return !decimalStr || decimalStr.length <= 1;
        },
        {
          message:
            "Cilt sırasında en fazla 1 ondalık basamak olabilir (Örn: 1.2)",
        },
      ),
    novelId: reqUuid("Roman Id"),
  }),
});

export type CreateVolumeDTO = z.infer<typeof createVolumeSchema>["body"];
