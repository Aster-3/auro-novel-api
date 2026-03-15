import { Router } from "express";
import { getNovelController } from "../factories/novel.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getNovelsSchema } from "../schemas/get.novels.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { createNovelSchema } from "../schemas/create.novel.schema.js";
import { createCommentSchema } from "../schemas/create.comment.schema.js";
import { updateCategoriesSchema } from "../schemas/update.categories.schema.js";
import { getCommentsSchema } from "../schemas/get.comments.schema.js";
import { updateTagsSchema } from "../schemas/update.tags.schema.js";
import { updateNovelSchema } from "../schemas/update.novel.schema.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getChaptersSchema } from "../schemas/get.chapters.schema.js";
const router = Router();
const novelController = getNovelController();

router.get("/", validateSchema(getNovelsSchema), novelController.getNovels); ///OKEY

router.post(
  "/",
  validateSchema(createNovelSchema),
  novelController.createNovel,
); ///OKEY

router.get(
  "/:id",
  validateSchema(paramsUuidSchema),
  novelController.getOneNovel,
); ///OKEY

router.patch(
  "/:id",
  validateSchema(updateNovelSchema),
  novelController.updateNovel,
); ///OKEY

router.get(
  "/:id/chapters/summary",
  validateSchema(uuidControlSchema),
  novelController.getChaptersSummary,
);

router.get(
  "/:id/chapters",
  validateSchema(getChaptersSchema),
  novelController.getChaptersByNovelId,
);

router.get(
  "/:id/comments",
  validateSchema(getCommentsSchema),
  novelController.getNovelComments,
); ///OKEY

router.post(
  "/:id/comments",
  validateSchema(createCommentSchema),
  novelController.addNovelComment,
); ///OKEY

router.post(
  "/:id/categories",
  validateSchema(updateCategoriesSchema),
  novelController.updateNovelCategories,
); ///OKEY

router.post(
  "/:id/tags",
  validateSchema(updateTagsSchema),
  novelController.updateNovelTags,
); ///OKEY

router.post(
  "/:id/views",
  validateSchema(paramsUuidSchema),
  novelController.incrementViewCount,
); ///OKEY

export default router;
