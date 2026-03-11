import { Router } from "express";
import { getCommentController } from "../factories/comment.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { deleteCommentSchema } from "../schemas/delete.comment.schema.js";
import { getCommentRepliesSchema } from "../schemas/get.comment.replies.schema.js";
import { toggleLikeSchema } from "../schemas/toggle.like.schema.js";

const router = Router();
const commentController = getCommentController();

router.delete(
  "/:id",
  validateSchema(deleteCommentSchema),
  commentController.deleteComment,
); // OKEY

router.get(
  "/:id/replies",
  validateSchema(getCommentRepliesSchema),
  commentController.getCommentReplies,
);

router.post(
  "/:id/like",
  validateSchema(toggleLikeSchema),
  commentController.toggleLike,
); // OKEY

router.get("/top-week", commentController.getTopCommentsOfLastWeek); // OKEY

export default router;
