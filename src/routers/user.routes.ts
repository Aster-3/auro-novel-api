import { Router } from "express";
import { getUserController } from "../factories/user.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getOneWithUuid } from "../schemas/get.one.with.uuid.schema.js";
import { queryPageAndLimitSchema } from "../schemas/queryPageAndLimitSchema.js";
import { userSearchShema } from "../schemas/search.user.schema.js";

const router = Router();

const userController = getUserController();

router.get(
  "/",
  validateSchema(queryPageAndLimitSchema),
  userController.getAllUsers,
);
router.get(
  "/search",
  validateSchema(userSearchShema),
  userController.searchUsers,
);
router.get("/:id", validateSchema(getOneWithUuid), userController.getOneUser);
export default router;
