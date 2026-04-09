import { Router } from "express";
import { chapterPurchaseController } from "../container.js";

const router = Router();

router.get("/", chapterPurchaseController.getAllChapterPurchases);

export default router;
