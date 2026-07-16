import * as z from "zod";
import { BannerTargetType } from "../constants/banner.constants.js";
import { reqUuid } from "../utils/zod.error.helper.js";

const booleanFromFormData = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const optionalTargetId = z.preprocess((value) => {
  if (value === "" || value === "null") return null;
  return value;
}, reqUuid("Hedef id").nullable().optional());

export const updateBannerSchema = z.object({
  params: z.object({
    id: reqUuid("Banner id"),
  }),
  body: z
    .object({
      targetType: z.enum(BannerTargetType).optional(),
      targetId: optionalTargetId,
      orderIndex: z.coerce.number().int().min(0).optional(),
      isActive: booleanFromFormData.optional(),
    })
    .optional()
    .default({}),
});

export type UpdateBannerDto = z.infer<typeof updateBannerSchema>["body"];
