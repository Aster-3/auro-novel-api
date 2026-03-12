import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const deleteVolumeSchema = z.object({
  params: z.object({
    id: reqUuid("Cilt id"),
  }),
});
