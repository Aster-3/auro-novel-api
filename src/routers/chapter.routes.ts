import { Router } from "express";
import { getChapterController } from "../factories/chapter.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterSchema } from "../schemas/create.chapter.schema.js";
import { deleteChapterSchema } from "../schemas/delete.chapter.schema.js";
import { updateChapterSchema } from "../schemas/update.chapter.schema.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware copy.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const chapterController = getChapterController();

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateSchema(uuidControlSchema),
  chapterController.getOneChapter,
);

router.post(
  "/",
  authMiddleware,
  validateSchema(createChapterSchema),
  chapterController.createChapter,
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
