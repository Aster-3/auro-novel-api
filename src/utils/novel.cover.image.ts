export function getNovelCoverImageUrl(coverImage?: string | null) {
  if (coverImage) return coverImage;

  return process.env.DEFAULT_NOVEL_COVER_IMAGE_URL || null;
}

export function isDefaultNovelCoverImageUrl(url?: string | null) {
  return Boolean(
    url &&
      process.env.DEFAULT_NOVEL_COVER_IMAGE_URL &&
      url === process.env.DEFAULT_NOVEL_COVER_IMAGE_URL,
  );
}

export function applyNovelCoverImageFallback<
  T extends { coverImage?: string | null },
>(novel: T): T {
  return {
    ...novel,
    coverImage: getNovelCoverImageUrl(novel.coverImage),
  };
}
