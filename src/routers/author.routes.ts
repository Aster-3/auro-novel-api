import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createAuthorSchema } from "../schemas/create.author.schmea.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getAuthorsSchema } from "../schemas/get.authors.schema.js";
import { authorController } from "../container.js";

const router = Router();

router.get("/", validateSchema(getAuthorsSchema), authorController.getAuthors);

router.post(
  "/",
  validateSchema(createAuthorSchema),
  authorController.createAuthor,
);
router.delete(
  "/:id",
  validateSchema(uuidControlSchema),
  authorController.deleteAuthor,
);

export default router;
