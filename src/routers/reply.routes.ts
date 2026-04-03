import { Router } from "express";
import { createReplySchema } from "../schemas/create.reply.schema.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { deleteReplySchema } from "../schemas/delete.reply.schema.js";
import { toggleReplyLikeSchema } from "../schemas/toggle.reply.like.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { replyController } from "../container.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateSchema(createReplySchema),
  replyController.createReply,
); // OKEY+

router.post(
  "/:replyId/toggle-like",
  authMiddleware,
  validateSchema(toggleReplyLikeSchema),
  replyController.toggleLike,
);

router.patch(
  "/:replyId",
  authMiddleware,
  validateSchema(deleteReplySchema),
  replyController.deleteReply,
); // OKEY

export default router;
