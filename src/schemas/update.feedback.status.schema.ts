import * as z from "zod";
import { FeedbackSubmissionStatus } from "../constants/feedback.constants.js";
import { reqUuid } from "../utils/zod.error.helper.js";

export const updateFeedbackStatusSchema = z.object({
  params: z.object({
    id: reqUuid("Feedback id"),
  }),
  body: z.object({
    status: z.enum(FeedbackSubmissionStatus),
  }),
});

export type UpdateFeedbackStatusDto = z.infer<
  typeof updateFeedbackStatusSchema
>["body"];
