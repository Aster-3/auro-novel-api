import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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
    return `${getEnv("R2_PUBLIC_URL").replace(/\/+$/, "")}/${fileName}`;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Dosya yüklenirken bir hata oluştu.");
  }
};

export const getS3KeyFromPublicUrl = (url?: string | null) => {
  if (!url) return null;

  const rawPublicUrl = getEnv("R2_PUBLIC_URL");
  const normalizedPrefix = `${rawPublicUrl.replace(/\/+$/, "")}/`;
  const legacyPrefix = `${rawPublicUrl}/`;
  const matchedPrefix = [normalizedPrefix, legacyPrefix].find((prefix) =>
    url.startsWith(prefix),
  );

  if (!matchedPrefix) {
    return null;
  }

  const key = url.slice(matchedPrefix.length);
  return key || null;
};

export const deleteFromS3ByUrl = async (url?: string | null) => {
  const key = getS3KeyFromPublicUrl(url);
  if (!key) return false;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: getEnv("R2_BUCKET_NAME"),
        Key: key,
      }),
    );
    return true;
  } catch (error) {
    console.error("R2 delete error:", error);
    return false;
  }
};

export const deleteManyFromS3ByUrl = async (
  urls: (string | null | undefined)[],
) => {
  const uniqueUrls = [...new Set(urls.filter(Boolean))] as string[];
  await Promise.all(uniqueUrls.map((url) => deleteFromS3ByUrl(url)));
};
