import sharp, { FitEnum } from "sharp";
import { BadRequestError } from "../errors/bad.request.js";

export type ImagePreset =
  | "profile"
  | "profile-background"
  | "novel-cover"
  | "banner"
  | "comment-attachment";

export type ProcessedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  extension: "webp";
  width: number;
  height: number;
  size: number;
};

type ImagePresetConfig = {
  width: number;
  height: number;
  fit: keyof FitEnum;
  quality: number;
  maxBytes: number;
  withoutEnlargement?: boolean;
};

const MAX_INPUT_PIXELS = 25_000_000;
const MIN_WEBP_QUALITY = 50;
const QUALITY_STEP = 5;

const IMAGE_PRESETS: Record<ImagePreset, ImagePresetConfig> = {
  profile: {
    width: 512,
    height: 512,
    fit: "cover",
    quality: 80,
    maxBytes: 120_000,
  },
  "profile-background": {
    width: 1600,
    height: 650,
    fit: "cover",
    quality: 80,
    maxBytes: 350_000,
  },
  "novel-cover": {
    width: 600,
    height: 900,
    fit: "cover",
    quality: 80,
    maxBytes: 200_000,
  },
  banner: {
    width: 1200,
    height: 450,
    fit: "cover",
    quality: 80,
    maxBytes: 400_000,
  },
  "comment-attachment": {
    width: 1600,
    height: 1600,
    fit: "inside",
    quality: 84,
    maxBytes: 750_000,
    withoutEnlargement: true,
  },
};

function getActualImageMimeType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function isAnimatedWebp(buffer: Buffer) {
  if (
    buffer.length < 21 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP" ||
    buffer.toString("ascii", 12, 16) !== "VP8X"
  ) {
    return false;
  }

  return Boolean(buffer[20] & 0x02);
}

function assertAllowedInput(buffer: Buffer) {
  const mimeType = getActualImageMimeType(buffer);

  if (!mimeType) {
    throw new BadRequestError("Sadece jpg, jpeg, png veya webp gorsel yuklenebilir.");
  }

  if (mimeType === "image/webp" && isAnimatedWebp(buffer)) {
    throw new BadRequestError("Animasyonlu webp gorseller desteklenmiyor.");
  }
}

function assertSafeDimensions(width?: number, height?: number) {
  if (!width || !height) {
    throw new BadRequestError("Gorsel boyutlari okunamadi.");
  }

  if (width * height > MAX_INPUT_PIXELS) {
    throw new BadRequestError("Gorsel piksel cozunurlugu cok buyuk.");
  }
}

export async function processImage(
  input: Buffer,
  preset: ImagePreset,
): Promise<ProcessedImage> {
  assertAllowedInput(input);

  const presetConfig = IMAGE_PRESETS[preset];
  const metadata = await sharp(input, {
    failOn: "truncated",
    limitInputPixels: MAX_INPUT_PIXELS,
  }).metadata();

  assertSafeDimensions(metadata.width, metadata.height);

  for (
    let quality = presetConfig.quality;
    quality >= MIN_WEBP_QUALITY;
    quality -= QUALITY_STEP
  ) {
    const { data, info } = await sharp(input, {
      failOn: "truncated",
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize(presetConfig.width, presetConfig.height, {
        fit: presetConfig.fit,
        position: "centre",
        withoutEnlargement: presetConfig.withoutEnlargement,
      })
      .webp({
        quality,
        effort: 4,
      })
      .toBuffer({ resolveWithObject: true });

    if (data.length <= presetConfig.maxBytes || quality === MIN_WEBP_QUALITY) {
      if (data.length > presetConfig.maxBytes) {
        throw new BadRequestError("Gorsel optimize edildikten sonra bile cok buyuk.");
      }

      return {
        buffer: data,
        contentType: "image/webp",
        extension: "webp",
        width: info.width,
        height: info.height,
        size: data.length,
      };
    }
  }

  throw new BadRequestError("Gorsel islenemedi.");
}
