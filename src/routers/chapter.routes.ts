import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterSchema } from "../schemas/create.chapter.schema.js";
import { deleteChapterSchema } from "../schemas/delete.chapter.schema.js";
import { updateChapterSchema } from "../schemas/update.chapter.schema.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware copy.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { chapterController } from "../container.js";
import { createPublicationSchema } from "../schemas/publish.chapter.schema.js";

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
  validateSchema(uuidControlSchema),
  chapterController.getOneChapter,
); /// OKEY

router.get(
  "/:id/draft",
  authMiddleware,
  validateSchema(uuidControlSchema),
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

export default router;
