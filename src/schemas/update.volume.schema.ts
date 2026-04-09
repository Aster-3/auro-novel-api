import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const updateVolumeSchema = z.object({
  params: z.object({
    id: reqUuid("Cilt Id"),
  }),
  body: z.object({
    name: reqString("Cilt Adı")
      .max(100, "Cilt adı en fazla 100 karakter olabilir")
      .nullable(),
  }),
});
