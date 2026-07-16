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

export const createBannerSchema = z.object({
  body: z
    .object({
      targetType: z.enum(BannerTargetType),
      targetId: optionalTargetId,
      orderIndex: z.coerce.number().int().min(0).optional().default(0),
      isActive: booleanFromFormData.optional().default(true),
    })
    .superRefine((data, ctx) => {
      if (data.targetType === BannerTargetType.NOVEL && !data.targetId) {
        ctx.addIssue({
          code: "custom",
          path: ["targetId"],
          message: "Novel banner icin hedef id zorunludur.",
        });
      }
    }),
});

export type CreateBannerDto = z.infer<typeof createBannerSchema>["body"];
