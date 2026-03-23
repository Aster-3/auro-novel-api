import * as z from "zod";
import { reqNumber } from "../utils/zod.error.helper.js";

export const deleteCommentSchema = z.object({
  params: z.object({
    commentId: z.preprocess((val) => Number(val), reqNumber("Comment id'si")),
  }),
});
