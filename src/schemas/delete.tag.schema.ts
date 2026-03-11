import * as z from "zod";
import { reqNumber, reqUuid } from "../utils/zod.error.helper.js";

export const deleteTagSchema = z.object({
  params: z.object({
    id: reqUuid("Etiket id'si"),
  }),
});
