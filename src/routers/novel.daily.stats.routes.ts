import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.schema.js";
import { getNovelStatsSchema } from "../schemas/get.novel.stats.schema.js";
import { novelDailyStatsController } from "../container.js";

const router = Router();

router.get(
  "/novels/:novelId/stats",
  authMiddleware,
  validateSchema(getNovelStatsSchema),
  novelDailyStatsController.getDashboardStats,
);

export default router;
