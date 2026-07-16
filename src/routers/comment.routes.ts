import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { deleteCommentSchema } from "../schemas/delete.comment.schema.js";
import { getCommentRepliesSchema } from "../schemas/get.comment.replies.schema.js";
import { toggleLikeSchema } from "../schemas/toggle.like.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { commentController } from "../container.js";

const router = Router();

router.get("/top-week", commentController.getTopCommentsOfLastWeek); // OKEY

router.get(
  "/:commentId",
  validateSchema(deleteCommentSchema),
  commentController.getOneCommentById,
);

router.delete(
  "/:commentId",
  validateSchema(deleteCommentSchema),
  authMiddleware,
  commentController.deleteComment,
); // OKEY

router.get(
  "/:id/replies",
  optionalAuthMiddleware,
  validateSchema(getCommentRepliesSchema),
  commentController.getCommentReplies,
);

router.post(
  "/:id/toggle-like",
  validateSchema(toggleLikeSchema),
  authMiddleware,
  commentController.toggleLike,
); // OKEY

export default router;
