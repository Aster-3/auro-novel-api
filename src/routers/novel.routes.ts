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
import { paramsNovelIdSchema } from "../schemas/params.novel.id.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware copy.js";
import multer from "multer";
import { ro } from "@faker-js/faker";
const router = Router();
const novelController = getNovelController();

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", validateSchema(getNovelsSchema), novelController.getNovels); ///OKEY

router.post(
  "/",
  upload.single("coverImage"),
  authMiddleware,
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
  upload.single("coverImage"),
  authMiddleware,
  validateSchema(updateNovelSchema),
  novelController.updateNovel,
); ///OKEY

router.delete(
  "/:id",
  validateSchema(paramsUuidSchema),
  novelController.deleteNovel,
); ///OKEY

router.get(
  "/:id/chapters/summary",
  validateSchema(uuidControlSchema),
  novelController.getChaptersSummary,
);

router.get(
  "/:id/chapters",
  optionalAuthMiddleware,
  validateSchema(getChaptersSchema),
  novelController.getChaptersByNovelId,
);

router.get(
  "/:novelId/comments",
  optionalAuthMiddleware,
  validateSchema(getCommentsSchema),
  novelController.getNovelComments,
); ///OKEY

router.get(
  "/:novelId/my-comment",
  optionalAuthMiddleware,
  validateSchema(paramsNovelIdSchema),
  novelController.getMyComment,
); ///OKEY

router.post(
  "/:novelId/comments",
  authMiddleware,
  validateSchema(createCommentSchema),
  novelController.addNovelComment,
); ///OKEY

router.get(
  "/:novelId/comments/last3",
  validateSchema(paramsNovelIdSchema),
  novelController.getLast3CommentsByNovelId,
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
