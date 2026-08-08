import { Router } from "express";
import { chapterCommentController } from "../container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { chapterCommentIdSchema } from "../schemas/chapter.comment.id.schema.js";
import { createChapterCommentReplySchema } from "../schemas/create.chapter.comment.schema.js";
import { getChapterCommentsSchema } from "../schemas/get.chapter.comments.schema.js";
import { chapterCommentImageUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.get(
  "/:commentId",
  optionalAuthMiddleware,
  validateSchema(chapterCommentIdSchema),
  chapterCommentController.getOneCommentById,
);

router.delete(
  "/:commentId",
  authMiddleware,
  validateSchema(chapterCommentIdSchema),
  chapterCommentController.deleteComment,
);

router.post(
  "/:commentId/toggle-like",
  authMiddleware,
  validateSchema(chapterCommentIdSchema),
  chapterCommentController.toggleLike,
);

router.get(
  "/:commentId/replies",
  optionalAuthMiddleware,
  validateSchema(getChapterCommentsSchema),
  chapterCommentController.getRepliesByCommentId,
);

router.post(
  "/:commentId/replies",
  authMiddleware,
  chapterCommentImageUpload.single("image"),
  validateSchema(createChapterCommentReplySchema),
  chapterCommentController.createReply,
);

export default router;
