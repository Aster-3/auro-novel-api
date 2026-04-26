import { Router } from "express";
import { adminController } from "../container.js";

const router = Router();

router.post("/notifications", adminController.createAnnouncement);

export default router;
