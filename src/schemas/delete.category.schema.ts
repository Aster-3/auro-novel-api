import * as z from "zod";
import { reqNumber } from "../utils/zod.error.helper.js";

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.preprocess((val) => Number(val), reqNumber("Kategori id'si")),
  }),
});
