import multer from "multer";
import { BadRequestError } from "../errors/bad.request.js";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const createImageUpload = (maxFileSizeMb: number) =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!imageMimeTypes.has(file.mimetype)) {
        cb(
          new BadRequestError(
            "Sadece jpg, jpeg, png veya webp gorsel yuklenebilir.",
          ),
        );
        return;
      }

      cb(null, true);
    },
  });

export const profileImageUpload = createImageUpload(3);
export const coverImageUpload = createImageUpload(5);
