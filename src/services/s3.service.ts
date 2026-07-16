import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getEnv } from "../utils/getEnv.js";

const s3Client = new S3Client({
  region: "auto",
  endpoint: getEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
  },
});

/**
 * @param {Buffer} fileBuffer - Dosyanın içeriği
 * @param {string} folder - Hangi klasöre gidecek (covers, avatars vb.)
 * @param {string} originalName - Dosyanın orijinal adı
 * @param {string} mimetype - image/jpeg, image/png vb.
 */

export const uploadToS3 = async (file: Express.Multer.File, folder: string) => {
  const safeOriginalName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  const fileName = `${folder}/${Date.now()}-${safeOriginalName}`;
  const params = {
    Bucket: getEnv("R2_BUCKET_NAME"),
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  try {
    await s3Client.send(new PutObjectCommand(params));
    return `${getEnv("R2_PUBLIC_URL")}/${fileName}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Dosya yüklenirken bir hata oluştu.");
  }
};
