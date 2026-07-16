import * as z from "zod";
import {
  FeedbackSubmissionStatus,
  FeedbackSubmissionType,
} from "../constants/feedback.constants.js";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

export const getFeedbackSubmissionsSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .min(1, "Sayfa numarasi 1'den kucuk olamaz.")
      .optional()
      .default(1),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalidir.")
      .max(100, "Tek seferde en fazla 100 kayit cekebilirsiniz.")
      .optional()
      .default(20),
    type: z.preprocess(
      emptyStringToUndefined,
      z.enum(FeedbackSubmissionType).optional(),
    ),
    status: z.preprocess(
      emptyStringToUndefined,
      z.enum(FeedbackSubmissionStatus).optional(),
    ),
  }),
});

export type GetFeedbackSubmissionsDto = z.infer<
  typeof getFeedbackSubmissionsSchema.shape.query
>;
