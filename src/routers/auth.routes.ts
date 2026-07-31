import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { registerSchema } from "../schemas/register.validation.js";
import { validateDto } from "../middlewares/validate.dto.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";
import { verifyUserSchema } from "../schemas/verify.user.schema.js";
import { resendCodeSchema } from "../interfaces/resend.code.interface.js";
import { userLoginSchema } from "../schemas/user.login.shema.js";
import { authController } from "../container.js";
import { forgotPasswordSchema } from "../schemas/forgot.password.schema.js";
import { resetPasswordSchema } from "../schemas/reset.password.schema.js";
import { changePasswordSchema } from "../schemas/change.password.schema.js";
import { googleLoginSchema } from "../schemas/google.login.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  authRateLimit,
  resendCodeRateLimit,
  strictAuthRateLimit,
} from "../middlewares/rate.limit.middleware.js";

const router = Router();

router.use(authRateLimit);

router.post(
  "/register",
  strictAuthRateLimit,
  validateSchema(registerSchema),
  validateDto(CreateUserDto),
  authController.register,
);
router.post(
  "/login",
  strictAuthRateLimit,
  validateSchema(userLoginSchema),
  authController.login,
);

router.post(
  "/google",
  strictAuthRateLimit,
  validateSchema(googleLoginSchema),
  authController.googleLogin,
);

router.post(
  "/verify",
  validateSchema(verifyUserSchema),
  authController.verifyUser,
);

router.post(
  "/resend-code",
  resendCodeRateLimit,
  validateSchema(resendCodeSchema),
  authController.resendVerificationCode,
);

router.post("/refresh-token", authController.refreshToken);

router.post(
  "/forgot-password",
  resendCodeRateLimit,
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  strictAuthRateLimit,
  validateSchema(resetPasswordSchema),
  authController.resetPassword,
);

router.post(
  "/change-password",
  authMiddleware,
  validateSchema(changePasswordSchema),
  authController.changePassword,
);

export default router;
