export const wordCounter = (htmlStr: string) => {
  if (!htmlStr) return 0;

  const htmlEntities: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
  };

  const plainText = htmlStr
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (match, entity) => htmlEntities[entity] ?? match)
    .replace(/\s+/g, " ")
    .trim();

  const matches = plainText.match(/\S+/g);
  return matches ? matches.length : 0;
};
