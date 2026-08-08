import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterSchema } from "../schemas/create.chapter.schema.js";
import { deleteChapterSchema } from "../schemas/delete.chapter.schema.js";
import { updateChapterSchema } from "../schemas/update.chapter.schema.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { chapterController } from "../container.js";
import { createPublicationSchema } from "../schemas/publish.chapter.schema.js";
import { createChapterCommentSchema } from "../schemas/create.chapter.comment.schema.js";
import { getChapterCommentsSchema } from "../schemas/get.chapter.comments.schema.js";
import { chapterCommentController } from "../container.js";
import { moveChapterSchema } from "../schemas/move.chapter.schema.js";
import { chapterCommentImageUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateSchema(createChapterSchema),
  chapterController.createChapter,
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateSchema(uuidControlSchema("params", "id")),
  chapterController.getOneChapter,
);

router.get(
  "/:id/offline",
  validateSchema(uuidControlSchema("params", "id")),
  chapterController.getOneOfflineChapter,
);

router.get(
  "/:chapterId/comments",
  optionalAuthMiddleware,
  validateSchema(getChapterCommentsSchema),
  chapterCommentController.getCommentsByChapterId,
);

router.post(
  "/:chapterId/comments",
  authMiddleware,
  chapterCommentImageUpload.single("image"),
  validateSchema(createChapterCommentSchema),
  chapterCommentController.createComment,
);

router.get(
  "/:id/draft",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "id")),
  chapterController.getOneDraftChapter,
);

router.post(
  "/:id/publish",
  authMiddleware,
  validateSchema(createPublicationSchema),
  chapterController.publishChapter,
);

router.patch(
  "/:id/move",
  authMiddleware,
  validateSchema(moveChapterSchema),
  chapterController.moveChapter,
);

router.patch(
  "/:id",
  authMiddleware,
  validateSchema(updateChapterSchema),
  chapterController.updateChapter,
);

router.delete(
  "/:id",
  authMiddleware,
  validateSchema(deleteChapterSchema),
  chapterController.deleteChapter,
);

export default router;
