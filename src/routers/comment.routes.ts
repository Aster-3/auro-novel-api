import { Router } from "express";
import { getCommentController } from "../factories/comment.factory.js";

const router = Router();
const commentController = getCommentController();

router.get("/", (req, res) => {
  res.send("Hello from Comment Routes");
});

// router.get("/series", commentController.g);
router.get("/user", commentController.getCommentsByUserId);

export default router;
