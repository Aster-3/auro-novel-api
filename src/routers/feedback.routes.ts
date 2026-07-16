import { Router } from "express";
import { feedbackController } from "../container.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createFeedbackSubmissionSchema } from "../schemas/create.feedback.submission.schema.js";

const router = Router();

router.post(
  "/",
  optionalAuthMiddleware,
  validateSchema(createFeedbackSubmissionSchema),
  feedbackController.createFeedbackSubmission,
);

export default router;
