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
import { PublicationStatus } from "../constants/chapter.constants.js";
import z from "zod";
import { createChapterCommentSchema } from "../schemas/create.chapter.comment.schema.js";
import { getChapterCommentsSchema } from "../schemas/get.chapter.comments.schema.js";
import { chapterCommentController } from "../container.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateSchema(createChapterSchema),
  chapterController.createChapter,
); ///OKEY

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateSchema(uuidControlSchema("params", "id")),
  chapterController.getOneChapter,
); /// OKEY

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
  validateSchema(createChapterCommentSchema),
  chapterCommentController.createComment,
);

router.get(
  "/:id/draft",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "id")),
  chapterController.getOneDraftChapter,
); /// OKEY

router.post(
  "/:id/publish",
  authMiddleware,
  validateSchema(createPublicationSchema),
  chapterController.publishChapter,
); ///OKEY

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

router.patch(
  "/:id/publication-status",
  authMiddleware,
  validateSchema(
    z.object({
      body: z.object({
        publicationStatus: z.enum(
          PublicationStatus,
          "Geçersiz yayınlanma durumu",
        ),
      }),
    }),
  ),
  chapterController.changePublicationStatus,
);

export default router;
