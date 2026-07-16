import * as z from "zod";
import { FeedbackSubmissionType } from "../constants/feedback.constants.js";

const metadataSchema = z
  .object({
    pageUrl: z.string().url().optional(),
    userAgent: z.string().max(500).optional(),
    locale: z.string().max(20).optional(),
    appVersion: z.string().max(50).optional(),
  })
  .catchall(z.unknown())
  .optional();

export const createFeedbackSubmissionSchema = z
  .object({
    body: z.object({
      type: z.enum(FeedbackSubmissionType),
      subject: z
        .string()
        .trim()
        .min(3, "Baslik en az 3 karakter olmalidir.")
        .max(120, "Baslik en fazla 120 karakter olabilir."),
      message: z
        .string()
        .trim()
        .min(10, "Mesaj en az 10 karakter olmalidir.")
        .max(5000, "Mesaj en fazla 5000 karakter olabilir."),
      email: z.string().trim().email("Gecerli bir email giriniz.").optional(),
      metadata: metadataSchema,
    }),
  })
  .passthrough();

export type CreateFeedbackSubmissionBody = z.infer<
  typeof createFeedbackSubmissionSchema.shape.body
>;
