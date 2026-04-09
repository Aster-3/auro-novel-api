import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createAuthorSchema } from "../schemas/create.author.schmea.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { getAuthorsSchema } from "../schemas/get.authors.schema.js";
import { authorController } from "../container.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getAuthorTransactionsSchema } from "../schemas/get.author.transactions.schema.js";

const router = Router();

router.get("/", validateSchema(getAuthorsSchema), authorController.getAuthors);

router.post(
  "/",
  authMiddleware,
  validateSchema(createAuthorSchema),
  authorController.createAuthor,
);

router.delete(
  "/:id",
  validateSchema(uuidControlSchema),
  authorController.deleteAuthor,
);

router.get("/my-wallet", authMiddleware, authorController.getAuthorWallet);

router.get(
  "/my-wallet/transactions",
  authMiddleware,
  validateSchema(getAuthorTransactionsSchema),
  authorController.getAuthorTransactions,
);

export default router;
