import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

const placementSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("end") }),
  z.object({ type: z.literal("before"), chapterId: reqUuid("Bolum Id") }),
  z.object({ type: z.literal("after"), chapterId: reqUuid("Bolum Id") }),
]);

export const moveChapterSchema = z.object({
  params: z.object({
    id: reqUuid("Bolum Id"),
  }),
  body: z.object({
    targetVolumeId: reqUuid("Cilt Id").optional(),
    placement: placementSchema.optional().default({ type: "end" }),
  }),
});

export type MoveChapterDTO = z.infer<typeof moveChapterSchema.shape.body> &
  z.infer<typeof moveChapterSchema.shape.params>;
