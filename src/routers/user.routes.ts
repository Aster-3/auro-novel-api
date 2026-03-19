import { Router } from "express";
import { getUserController } from "../factories/user.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { getUsersSchema } from "../schemas/get.users.schema.js";
import { updateUserSchema } from "../schemas/update.user.schema.js";
import { getMeSchema } from "../schemas/get.me.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

const userController = getUserController();

router.get(
  "/me",
  authMiddleware,
  validateSchema(getMeSchema),
  userController.getMe,
);

router.get("/:id", validateSchema(paramsUuidSchema), userController.getOneUser);

router.get("/", validateSchema(getUsersSchema), userController.getUsers);

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

router.get("/verifications/all", userController.getAllVerifications);

export default router;
