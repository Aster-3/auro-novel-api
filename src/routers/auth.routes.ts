import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { registerSchema } from "../schemas/register.validation.js";
import { getAuthController } from "../factories/auth.factory.js";
import { validateDto } from "../middlewares/validate.dto.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { verifyUserSchema } from "../schemas/verify.user.schema.js";
import { resendCodeSchema } from "../interfaces/resend.code.interface.js";
import { userLoginSchema } from "../schemas/user.login.shema.js";

const router = Router();
const authController = getAuthController();

router.post(
  "/register",
  validateSchema(registerSchema),
  validateDto(CreateUserDto),
  authController.register,
);
router.post("/login", validateSchema(userLoginSchema), authController.login);

router.post(
  "/verify",
  validateSchema(verifyUserSchema),
  authController.verifyUser,
);

router.post(
  "/resend-code",
  validateSchema(resendCodeSchema),
  authController.resendVerificationCode,
);

router.post("/refresh-token", authController.refreshToken);

export default router;
