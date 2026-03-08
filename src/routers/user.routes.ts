import { Router } from "express";
import { getUserController } from "../factories/user.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getOneUserSchema } from "../schemas/get.one.user.schema.js";
import { getAllUserSchema } from "../schemas/get.all.user.schema.js";
import { userSearchShema } from "../schemas/search.user.schema.js";

const router = Router();

const userController = getUserController();

router.get("/", validateSchema(getAllUserSchema), userController.getAllUsers);
router.get(
  "/search",
  validateSchema(userSearchShema),
  userController.searchUsers,
);
router.get("/:id", validateSchema(getOneUserSchema), userController.getOneUser);
export default router;
