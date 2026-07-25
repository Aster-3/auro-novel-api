import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { getUsersSchema } from "../schemas/get.users.schema.js";
import { updateUserSchema } from "../schemas/update.user.schema.js";
import { getMeSchema } from "../schemas/get.me.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { userController } from "../container.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { updateReadingStatsSchema } from "../schemas/update.reading.stats.schema.js";
import { getMyLibrarySchema } from "../schemas/get.my.library.schema.js";
import { getNotificationsSchema } from "../schemas/get.notifications.schema.js";
import {
  registerUserDeviceSchema,
  unregisterUserDeviceSchema,
} from "../schemas/register.user.device.schema.js";
import { getUserFollowsSchema } from "../schemas/get.user.follows.schema.js";
import {
  getUserLibraryShowcaseSchema,
  getUserShowcaseSchema,
} from "../schemas/get.user.showcase.schema.js";
import { profileImageUpload } from "../middlewares/upload.middleware.js";
import { deleteMyAccountSchema } from "../schemas/delete.my.account.schema.js";

const router = Router({ strict: true });

router.get("/", validateSchema(getUsersSchema), userController.getUsers);

router.get(
  "/me",
  authMiddleware,
  validateSchema(getMeSchema),
  userController.getMe,
);

router.get(
  "/me/library",
  authMiddleware,
  validateSchema(getMyLibrarySchema),
  userController.getMyLibrary,
);

router.post(
  "/me/library",
  authMiddleware,
  validateSchema(uuidControlSchema("body", "novelId")),
  userController.toggleNovelInLibrary,
);

router.get(
  "/me/library/:novelId",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "novelId")),
  userController.isNovelInLibrary,
);

router.patch(
  "/me",
  authMiddleware,
  profileImageUpload.fields([
    { name: "profileImageUrl", maxCount: 1 },
    { name: "profileBackgroundImageUrl", maxCount: 1 },
  ]),
  validateSchema(updateUserSchema),
  userController.updateUser,
);

router.delete(
  "/me",
  authMiddleware,
  validateSchema(deleteMyAccountSchema),
  userController.deleteMyAccount,
);

router.get("/me/reading-stats", authMiddleware, userController.getReadingStats);

router.get(
  "/me/reading-stats/:novelId",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "novelId")),
  userController.getUserNovelStats,
);

router.patch(
  "/me/reading-stats",
  authMiddleware,
  validateSchema(updateReadingStatsSchema),
  userController.updateReadingStats,
);

router.get(
  "/me/notifications/personal",
  authMiddleware,
  validateSchema(getNotificationsSchema),
  userController.getPersonalNotifications,
);

router.get(
  "/me/notifications/global",
  authMiddleware,
  validateSchema(getNotificationsSchema),
  userController.getGlobalNotifications,
);

router.delete(
  "/me/notifications/personal/:notificationId",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "notificationId")),
  userController.deletePersonalNotification,
);

router.patch(
  "/me/notifications/personal/:notificationId/read",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "notificationId")),
  userController.markPersonalNotificationAsRead,
);

router.patch(
  "/me/notifications/personal/read",
  authMiddleware,
  userController.markAllPersonalNotificationsAsRead,
);

router.patch(
  "/me/notifications/global/last-seen",
  authMiddleware,
  userController.setLastGlobalNotificationSeenAt,
);

router.post(
  "/me/notifications/global/last-seen",
  authMiddleware,
  userController.setLastGlobalNotificationSeenAt,
);

router.get(
  "/me/notifications/global/:notificationId",
  authMiddleware,
  validateSchema(uuidControlSchema("params", "notificationId")),
  userController.getGlobalNotificationById,
);

router.get(
  "/me/notifications/unread-count",
  authMiddleware,
  userController.getTotalUnreadNotificationCount,
);

router.post(
  "/me/devices",
  authMiddleware,
  validateSchema(registerUserDeviceSchema),
  userController.registerDevice,
);

router.delete(
  "/me/devices",
  authMiddleware,
  validateSchema(unregisterUserDeviceSchema),
  userController.unregisterDevice,
);

router.get(
  "/:id/reviews",
  optionalAuthMiddleware,
  validateSchema(getUserShowcaseSchema),
  userController.getUserReviews,
);

router.get(
  "/:id/replies",
  optionalAuthMiddleware,
  validateSchema(getUserShowcaseSchema),
  userController.getUserReplies,
);

router.get(
  "/:id/library",
  validateSchema(getUserLibraryShowcaseSchema),
  userController.getUserLibrary,
);

router.get(
  "/:id/activity",
  optionalAuthMiddleware,
  validateSchema(paramsUuidSchema),
  userController.getUserRecentActivity,
);

router.post(
  "/:id/follow",
  authMiddleware,
  validateSchema(paramsUuidSchema),
  userController.followUser,
);

router.delete(
  "/:id/follow",
  authMiddleware,
  validateSchema(paramsUuidSchema),
  userController.unfollowUser,
);

router.get(
  "/:id/follow-status",
  authMiddleware,
  validateSchema(paramsUuidSchema),
  userController.getFollowStatus,
);

router.get(
  "/:id/follow-counts",
  validateSchema(paramsUuidSchema),
  userController.getFollowCounts,
);

router.get(
  "/:id/followers",
  validateSchema(getUserFollowsSchema),
  userController.getFollowers,
);

router.get(
  "/:id/following",
  validateSchema(getUserFollowsSchema),
  userController.getFollowing,
);

router.get(
  "/verifications/all",
  adminMiddleware,
  userController.getAllVerifications,
);

router.get("/:id", validateSchema(paramsUuidSchema), userController.getOneUser);

export default router;
