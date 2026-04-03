import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterPurchaseSchema } from "../schemas/create.chapter.purchase.schema.js";
import { chapterPurchaseController } from "../container.js";

const router = Router();

router.get("/", chapterPurchaseController.getAllChapterPurchases);
router.post(
  "/",
  validateSchema(createChapterPurchaseSchema),
  chapterPurchaseController.createChapterPurchase,
);

export default router;
