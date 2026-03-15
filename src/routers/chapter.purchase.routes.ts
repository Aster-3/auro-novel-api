import { Router } from "express";
import { getChapterPurchaseController } from "../factories/chapter.purchase.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createChapterPurchaseSchema } from "../schemas/create.chapter.purchase.schema.js";

const router = Router();
const chapterPurchaseController = getChapterPurchaseController();

router.get("/", chapterPurchaseController.getAllChapterPurchases);
router.post(
  "/",
  validateSchema(createChapterPurchaseSchema),
  chapterPurchaseController.createChapterPurchase,
);

export default router;
