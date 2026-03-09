import { Router } from "express";
import { getCommentController } from "../factories/comment.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { queryPageAndLimitSchema } from "../schemas/queryPageAndLimitSchema.js";

const router = Router();
const commentController = getCommentController();

router.delete("/:id", commentController.deleteComment);
router.get(
  "/search",
  validateSchema(queryPageAndLimitSchema),
  commentController.searchComments,
);

router.get("/replies", commentController.getCommentReplies);

export default router;
