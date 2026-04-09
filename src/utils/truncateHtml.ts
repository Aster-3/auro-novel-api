import * as truncate from "truncate-html";

export const truncateHtml = (content: string, length: number): string => {
  // Eğer truncate bir fonksiyonsa onu çağır, değilse default'unu çağır
  const truncateFn =
    typeof truncate === "function" ? truncate : (truncate as any).default;

  return truncateFn(content, length, {
    byWords: true,
    ellipsis: "...",
  });
};
