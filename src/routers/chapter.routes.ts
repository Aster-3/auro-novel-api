import { Router } from "express";
import { getChapterController } from "../factories/chapter.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterSchema } from "../schemas/create.chapter.schema.js";
import { deleteChapterSchema } from "../schemas/delete.chapter.schema.js";
import { getChaptersSchema } from "../schemas/get.chapters.schema.js";

const router = Router();
const chapterController = getChapterController();

router.get(
  "/:id",
  validateSchema(getChaptersSchema),
  chapterController.getChapterByNovelId,
);

router.post(
  "/",
  validateSchema(createChapterSchema),
  chapterController.createChapter,
);
router.delete(
  "/:id",
  validateSchema(deleteChapterSchema),
  chapterController.deleteChapter,
);

export default router;
