import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const uuidControlSchema = z.object({
  params: z.object({
    id: reqUuid("Geçersiz UUID formatı"),
  }),
});
