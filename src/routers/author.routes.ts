import { Router } from "express";
import { getAuthorController } from "../factories/author.factory.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createAuthorSchema } from "../schemas/create.author.schmea.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getAuthorsSchema } from "../schemas/get.authors.schema.js";

const router = Router();
const authorController = getAuthorController();

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
