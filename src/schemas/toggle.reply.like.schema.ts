import * as z from "zod";
import { reqNumber } from "../utils/zod.error.helper.js";

export const toggleReplyLikeSchema = z.object({
  params: z.object({
    replyId: z.preprocess((val) => Number(val), reqNumber("Reply id'si")),
  }),
});
