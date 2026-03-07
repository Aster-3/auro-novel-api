import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { registerSchema } from "../schemas/register.validation.js";
import { getAuthController } from "../factories/auth.factory.js";
import { validateDto } from "../middlewares/validate.dto.js";
import { CreateUserDto } from "../dtos/create.user.dto.js";

const router = Router();
const authController = getAuthController();

router.post(
  "/register",
  validateSchema(registerSchema),
  validateDto(CreateUserDto),
  authController.register,
);
router.post("/login", authController.login);

export default router;
