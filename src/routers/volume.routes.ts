import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createVolumeSchema } from "../schemas/create.volume.schema.js";
import { deleteVolumeSchema } from "../schemas/delete.volume.schema.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { volumeController } from "../container.js";

const router = Router();

router.get(
  "/novel/:id",
  validateSchema(uuidControlSchema),
  volumeController.getVolumeByNovelId,
);

router.post(
  "/",
  authMiddleware,
  validateSchema(createVolumeSchema),
  volumeController.createVolume,
);
router.delete(
  "/:id",
  validateSchema(deleteVolumeSchema),
  volumeController.deleteVolume,
);

export default router;
