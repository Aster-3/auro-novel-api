import { Router } from "express";
import { getUserController } from "../factories/user.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { paramsUuidSchema } from "../schemas/paramsUuidSchema.js";
import { getUsersSchema } from "../schemas/get.users.schema.js";

const router = Router();

const userController = getUserController();

router.get("/", validateSchema(getUsersSchema), userController.getUsers);

router.get("/:id", validateSchema(paramsUuidSchema), userController.getOneUser);

export default router;
