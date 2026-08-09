import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getNovelsSchema } from "../schemas/get.novels.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { createNovelSchema } from "../schemas/create.novel.schema.js";
import { createCommentSchema } from "../schemas/create.comment.schema.js";
import { updateCategoriesSchema } from "../schemas/update.categories.schema.js";
import { getCommentsSchema } from "../schemas/get.comments.schema.js";
import { updateTagsSchema } from "../schemas/update.tags.schema.js";
import { updateNovelSchema } from "../schemas/update.novel.schema.js";
import { getChaptersSchema } from "../schemas/get.chapters.schema.js";
import { paramsNovelIdSchema } from "../schemas/params.novel.id.schema.js";
import { offlineChaptersSchema } from "../schemas/offline.chapters.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { novelController } from "../container.js";
import { editorPickController } from "../container.js";
import { coverImageUpload } from "../middlewares/upload.middleware.js";
import { getSimilarNovelsSchema } from "../schemas/get.similar.novels.schema.js";
const router = Router();

router.get(
  "/",
  optionalAuthMiddleware,
  validateSchema(getNovelsSchema),
  novelController.getNovels,
); ///OKEY

router.post(
  "/",
  coverImageUpload.single("coverImage"),
  authMiddleware,
  validateSchema(createNovelSchema),
  novelController.createNovel,
); ///OKEY

router.get(
  "/last-updated",
  optionalAuthMiddleware,
  novelController.getLastUpdatedNovels,
); ///OKEY

router.get(
  "/weekly-trending",
  optionalAuthMiddleware,
  novelController.getWeeklyTrendingNovels,
); ///OKEY

router.get(
  "/classics",
  optionalAuthMiddleware,
  novelController.getRandomClassicNovels,
); ///OKEY

router.get(
  "/last-created",
  optionalAuthMiddleware,
  novelController.getLastCreatedNovels,
); ///OKEY

router.get(
  "/editor-picks",
  optionalAuthMiddleware,
  editorPickController.getHomeEditorPicks,
);

router.get(
  "/with-tag/:id",
  optionalAuthMiddleware,
  validateSchema(paramsUuidSchema),
  novelController.getNovelsWithTagId,
); ///OKEY

router.get(
  "/:id/download",
  validateSchema(paramsUuidSchema),
  novelController.getNovelDownloadPackage,
);

router.get(
  "/:id/offline-manifest",
  validateSchema(paramsUuidSchema),
  novelController.getOfflineManifest,
);

router.get(
  "/:id/similar",
  optionalAuthMiddleware,
  validateSchema(getSimilarNovelsSchema),
  novelController.getSimilarNovels,
);

router.post(
  "/:id/offline-chapters",
  validateSchema(offlineChaptersSchema),
  novelController.getOfflineChaptersPackage,
);

router.get(
  "/:id",
  optionalAuthMiddleware,
  validateSchema(paramsUuidSchema),
  novelController.getOneNovel,
); ///OKEY

router.patch(
  "/:id",
  coverImageUpload.single("coverImage"),
  authMiddleware,
  validateSchema(updateNovelSchema),
  novelController.updateNovel,
); ///OKEY

router.delete(
  "/:id",
  authMiddleware,
  validateSchema(paramsUuidSchema),
  novelController.deleteNovel,
);

router.get(
  "/:id/draft-chapters",
  authMiddleware,
  validateSchema(getChaptersSchema),
  novelController.getDraftChaptersByNovelId,
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
  optionalAuthMiddleware,
  validateSchema(paramsNovelIdSchema),
  novelController.getLast3CommentsByNovelId,
); ///OKEY

router.post(
  "/:id/categories",
  authMiddleware,
  validateSchema(updateCategoriesSchema),
  novelController.updateNovelCategories,
); ///OKEY

router.post(
  "/:id/tags",
  authMiddleware,
  validateSchema(updateTagsSchema),
  novelController.updateNovelTags,
); ///OKEY

router.post(
  "/:id/views",
  validateSchema(paramsUuidSchema),
  novelController.incrementViewCount,
); ///OKEY

export default router;
