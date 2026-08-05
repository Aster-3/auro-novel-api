import { Router } from "express";
import { validateSchema } from "../middlewares/validate.schema.js";
import { createVolumeSchema } from "../schemas/create.volume.schema.js";
import { deleteVolumeSchema } from "../schemas/delete.volume.schema.js";
import { uuidControlSchema } from "../schemas/uuid.control.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../middlewares/optional.auth.middleware.js";
import { volumeController } from "../container.js";
import { updateVolumeSchema } from "../schemas/update.volume.schema.js";

const router = Router();

router.get(
  "/novel/:id",
  optionalAuthMiddleware,
  validateSchema(uuidControlSchema()),
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
  authMiddleware,
  validateSchema(deleteVolumeSchema),
  volumeController.deleteVolume,
);

router.patch(
  "/:id",
  authMiddleware,
  validateSchema(updateVolumeSchema),
  volumeController.updateVolume,
);

export default router;
