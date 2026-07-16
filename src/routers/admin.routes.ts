import { Router } from "express";
import { adminController } from "../container.js";
import { feedbackController } from "../container.js";
import { bannerController } from "../container.js";
import {
  authorController,
  categoryController,
  tagController,
} from "../container.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createGlobalNotificationSchema } from "../schemas/create.global.notification.schema.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getFeedbackSubmissionsSchema } from "../schemas/get.feedback.submissions.schema.js";
import { updateFeedbackStatusSchema } from "../schemas/update.feedback.status.schema.js";
import { createBannerSchema } from "../schemas/create.banner.schema.js";
import { updateBannerSchema } from "../schemas/update.banner.schema.js";
import { updateBannerStatusSchema } from "../schemas/update.banner.status.schema.js";
import { reorderBannersSchema } from "../schemas/reorder.banners.schema.js";
import { deleteVolumeSchema } from "../schemas/delete.volume.schema.js";
import { updateVolumeSchema } from "../schemas/update.volume.schema.js";
import { updateCategoriesSchema } from "../schemas/update.categories.schema.js";
import { updateTagsSchema } from "../schemas/update.tags.schema.js";
import { getAuthorsSchema } from "../schemas/get.authors.schema.js";
import { createCategorySchema } from "../schemas/create.category.schema.js";
import { deleteCategorySchema } from "../schemas/delete.category.schema.js";
import { searchCategorySchema } from "../schemas/search.category.schema.js";
import { updateCategorySchema } from "../schemas/update.category.schema.js";
import { createTagSchema } from "../schemas/create.tag.schema.js";
import { deleteTagSchema } from "../schemas/delete.tag.schema.js";
import { searchTagSchema } from "../schemas/search.tag.schema.js";
import {
  adminListChaptersSchema,
  adminListCommentsSchema,
  adminListNotificationsSchema,
  adminListNovelsSchema,
  adminListRepliesSchema,
  adminListUsersSchema,
  adminCreateAuthorSchema,
  adminCreateChapterSchema,
  adminCreateNovelSchema,
  adminCreateVolumeSchema,
  adminPublishChapterSchema,
  adminUpdateChapterSchema,
  adminUpdateChapterPublicationSchema,
  adminUpdateNotificationSchema,
  adminUpdateNovelSchema,
  adminUpdateUserSchema,
} from "../schemas/admin.schema.js";
import z from "zod";
import { coverImageUpload } from "../middlewares/upload.middleware.js";

const router = Router();

const numericIdParamSchema = (name: string) =>
  z.object({
    params: z.object({
      [name]: z.coerce.number().int().positive(),
    }),
  });

router.get("/dashboard", adminController.getDashboard);

router.get(
  "/users",
  validateSchema(adminListUsersSchema),
  adminController.getUsers,
);

router.get(
  "/users/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.getUserById,
);

router.patch(
  "/users/:id",
  validateSchema(adminUpdateUserSchema),
  adminController.updateUser,
);

router.delete(
  "/users/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.deleteUser,
);

router.get(
  "/novels",
  validateSchema(adminListNovelsSchema),
  adminController.getNovels,
);

router.post(
  "/novels",
  coverImageUpload.single("coverImage"),
  validateSchema(adminCreateNovelSchema),
  adminController.createNovel,
);

router.get(
  "/novels/:id/volumes",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.getVolumesByNovelId,
);

router.post(
  "/novels/:id/volumes",
  validateSchema(adminCreateVolumeSchema),
  adminController.createVolume,
);

router.patch(
  "/volumes/:id",
  validateSchema(updateVolumeSchema),
  adminController.updateVolume,
);

router.delete(
  "/volumes/:id",
  validateSchema(deleteVolumeSchema),
  adminController.deleteVolume,
);

router.post(
  "/novels/:id/chapters",
  validateSchema(adminCreateChapterSchema),
  adminController.createChapter,
);

router.post(
  "/novels/:id/categories",
  validateSchema(updateCategoriesSchema),
  adminController.updateNovelCategories,
);

router.post(
  "/novels/:id/tags",
  validateSchema(updateTagsSchema),
  adminController.updateNovelTags,
);

router.get(
  "/novels/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.getNovelById,
);

router.patch(
  "/novels/:id",
  validateSchema(adminUpdateNovelSchema),
  adminController.updateNovel,
);

router.delete(
  "/novels/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.deleteNovel,
);

router.get(
  "/chapters",
  validateSchema(adminListChaptersSchema),
  adminController.getChapters,
);

router.get(
  "/chapters/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.getChapterById,
);

router.post(
  "/chapters/:id/publish",
  validateSchema(adminPublishChapterSchema),
  adminController.publishChapter,
);

router.patch(
  "/chapters/:id",
  validateSchema(adminUpdateChapterSchema),
  adminController.updateChapter,
);

router.patch(
  "/chapters/:id/publication-status",
  validateSchema(adminUpdateChapterPublicationSchema),
  adminController.updateChapterPublicationStatus,
);

router.delete(
  "/chapters/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.deleteChapter,
);

router.get(
  "/comments",
  validateSchema(adminListCommentsSchema),
  adminController.getComments,
);

router.delete(
  "/comments/:id",
  validateSchema(numericIdParamSchema("id")),
  adminController.deleteComment,
);

router.get(
  "/replies",
  validateSchema(adminListRepliesSchema),
  adminController.getReplies,
);

router.delete(
  "/replies/:id",
  validateSchema(numericIdParamSchema("id")),
  adminController.deleteReply,
);

router.get(
  "/authors",
  validateSchema(getAuthorsSchema),
  authorController.getAuthors,
);

router.post(
  "/authors",
  validateSchema(adminCreateAuthorSchema),
  adminController.createIndependentAuthor,
);

router.delete(
  "/authors/:id",
  validateSchema(uuidControlSchema("params", "id")),
  authorController.deleteAuthor,
);

router.get(
  "/categories",
  validateSchema(searchCategorySchema),
  categoryController.searchCategories,
);

router.post(
  "/categories",
  validateSchema(createCategorySchema),
  categoryController.createCategory,
);

router.patch(
  "/categories/:id",
  validateSchema(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  "/categories/:id",
  validateSchema(deleteCategorySchema),
  categoryController.deleteCategory,
);

router.get("/tags", validateSchema(searchTagSchema), tagController.searchTags);

router.post("/tags", validateSchema(createTagSchema), tagController.createTag);

router.delete(
  "/tags/:id",
  validateSchema(deleteTagSchema),
  tagController.deleteTag,
);

router.get(
  "/notifications",
  validateSchema(adminListNotificationsSchema),
  adminController.getAnnouncements,
);

router.post(
  "/notifications",
  validateSchema(createGlobalNotificationSchema),
  adminController.createAnnouncement,
);

router.get(
  "/notifications/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.getAnnouncementById,
);

router.patch(
  "/notifications/:id",
  validateSchema(adminUpdateNotificationSchema),
  adminController.updateAnnouncement,
);

router.delete(
  "/notifications/:id",
  validateSchema(uuidControlSchema("params", "id")),
  adminController.deleteAnnouncement,
);

router.get(
  "/feedback",
  validateSchema(getFeedbackSubmissionsSchema),
  feedbackController.getFeedbackSubmissions,
);

router.patch(
  "/feedback/:id/status",
  validateSchema(updateFeedbackStatusSchema),
  feedbackController.updateFeedbackStatus,
);

router.get(
  "/feedback/:id",
  validateSchema(uuidControlSchema("params", "id")),
  feedbackController.getFeedbackSubmissionById,
);

router.get("/banners", bannerController.getAdminBanners);

router.post(
  "/banners",
  coverImageUpload.single("bannerImage"),
  validateSchema(createBannerSchema),
  bannerController.createBanner,
);

router.patch(
  "/banners/reorder",
  validateSchema(reorderBannersSchema),
  bannerController.reorderBanners,
);

router.patch(
  "/banners/:id/status",
  validateSchema(updateBannerStatusSchema),
  bannerController.updateBannerStatus,
);

router.patch(
  "/banners/:id",
  coverImageUpload.single("bannerImage"),
  validateSchema(updateBannerSchema),
  bannerController.updateBanner,
);

router.delete(
  "/banners/:id",
  validateSchema(uuidControlSchema("params", "id")),
  bannerController.deleteBanner,
);

export default router;
