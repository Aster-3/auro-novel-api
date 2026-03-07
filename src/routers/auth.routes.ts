import { Router } from "express";
import { validate } from "../middlewares/validate.schema.js";
import { registerSchema } from "../validations/register.validation.js";
import { getAuthController } from "../factories/auth.factory.js";

const router = Router();
const authController = getAuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
