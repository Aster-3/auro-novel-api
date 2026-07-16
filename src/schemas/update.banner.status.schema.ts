import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

const booleanFromFormData = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const updateBannerStatusSchema = z.object({
  params: z.object({
    id: reqUuid("Banner id"),
  }),
  body: z.object({
    isActive: booleanFromFormData,
  }),
});

export type UpdateBannerStatusDto = z.infer<
  typeof updateBannerStatusSchema
>["body"];
