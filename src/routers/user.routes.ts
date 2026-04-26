import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { getUsersSchema } from "../schemas/get.users.schema.js";
import { updateUserSchema } from "../schemas/update.user.schema.js";
import { getMeSchema } from "../schemas/get.me.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { userController } from "../container.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { updateReadingStatsSchema } from "../schemas/update.reading.stats.schema.js";
import { getMyLibrarySchema } from "../schemas/get.my.library.schema.js";
import { getNotificationsSchema } from "../schemas/get.notifications.schema.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router({ strict: true });

router.get("/", validateSchema(getUsersSchema), userController.getUsers);

router.get(
  "/me",
  authMiddleware,
  validateSchema(getMeSchema),
  userController.getMe,
);

router.get("/:id", validateSchema(paramsUuidSchema), userController.getOneUser);

router.delete(
  "/:id",
  validateSchema(paramsUuidSchema),
  userController.deleteUser,
);

router.get("/me/wallet", authMiddleware, userController.getUserBalance);

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
  upload.fields([
    { name: "profileImageUrl", maxCount: 1 },
    { name: "profileBackgroundImageUrl", maxCount: 1 },
  ]),
  validateSchema(updateUserSchema),
  userController.updateUser,
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

router.post(
  "/me/notifications/personal",
  authMiddleware,
  userController.createPersonalNotification,
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
  userController.setLastSeenNotificationDate,
);

router.get(
  "/me/notifications/unread-count",
  authMiddleware,
  userController.getTotalUnreadNotificationCount,
);

router.get("/verifications/all", userController.getAllVerifications);

export default router;
