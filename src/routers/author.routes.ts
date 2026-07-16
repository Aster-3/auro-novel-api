import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createAuthorSchema } from "../schemas/create.author.schmea.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getAuthorsSchema } from "../schemas/get.authors.schema.js";
import { authorController } from "../container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { queryPageAndLimitSchema } from "../schemas/queryPageAndLimitSchema.js";

const router = Router();

router.get("/", validateSchema(getAuthorsSchema), authorController.getAuthors);

router.get(
  "/me/novels",
  authMiddleware,
  validateSchema(queryPageAndLimitSchema),
  authorController.getMyNovels,
);

router.get("/me", authMiddleware, authorController.getMe);

router.post(
  "/",
  authMiddleware,
  validateSchema(createAuthorSchema),
  authorController.createAuthor,
);

router.delete(
  "/:id",
  adminMiddleware,
  validateSchema(uuidControlSchema()),
  authorController.deleteAuthor,
);

export default router;
