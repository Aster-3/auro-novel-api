import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const deleteChapterSchema = z.object({
  params: z.object({
    id: reqUuid("Bölüm Id"),
  }),
});
