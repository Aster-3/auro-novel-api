import { Router } from "express";
import { getReplyController } from "../factories/reply.factory.js";
import { createReplySchema } from "../schemas/create.reply.schema.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { deleteReplySchema } from "../schemas/delete.reply.schema.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware copy.js";

const router = Router();
const replyController = getReplyController();

router.post(
  "/",
  // optionalAuthMiddleware,
  validateSchema(createReplySchema),
  replyController.createReply,
); // OKEY+

router.delete(
  "/:id",
  // optionalAuthMiddleware,
  validateSchema(deleteReplySchema),
  replyController.deleteReply,
); // OKEY

export default router;
