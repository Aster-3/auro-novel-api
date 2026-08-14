import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getEnv } from "../utils/getEnv.js";
import { ImagePreset, processImage } from "../utils/image.processing.js";
import { isDefaultNovelCoverImageUrl } from "../utils/novel.cover.image.js";

const s3Client = new S3Client({
  region: "auto",
  endpoint: getEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: getEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getEnv("R2_SECRET_ACCESS_KEY"),
  },
});

export type UploadedImage = {
  url: string;
  key: string;
  width: number;
  height: number;
  size: number;
  contentType: "image/webp";
};

export const uploadImageToS3 = async (
  file: Express.Multer.File,
  folder: string,
  preset: ImagePreset,
): Promise<UploadedImage> => {
  const image = await processImage(file.buffer, preset);
  const fileName = `${folder}/${randomUUID()}-${image.width}x${image.height}.${image.extension}`;
  const params = {
    Bucket: getEnv("R2_BUCKET_NAME"),
    Key: fileName,
    Body: image.buffer,
    ContentType: image.contentType,
    CacheControl: "public, max-age=31536000, immutable",
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    return {
      url: `${getEnv("R2_PUBLIC_URL").replace(/\/+$/, "")}/${fileName}`,
      key: fileName,
      width: image.width,
      height: image.height,
      size: image.size,
      contentType: image.contentType,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new Error("Dosya yuklenirken bir hata olustu.");
  }
};

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string,
  preset: ImagePreset,
) => {
  const image = await uploadImageToS3(file, folder, preset);
  return image.url;
};

export const getS3KeyFromPublicUrl = (url?: string | null) => {
  if (!url) return null;
  if (isDefaultNovelCoverImageUrl(url)) return null;

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
