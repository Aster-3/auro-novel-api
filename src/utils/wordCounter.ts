export const wordCounter = (htmlStr: string) => {
  if (!htmlStr) return 0;

  // 1. HTML etiketlerini boşlukla değiştir (Böylece <p> bitince kelime bitmiş sayılır)
  // 2. Ardından tüm boşluk karakterlerini normalize et
  const plainText = htmlStr
    .replace(/<[^>]*>/g, " ") // Tüm <...> yapılarını boşlukla değiştir
    .trim();

  // 3. Şimdi temizlenmiş metni say
  const matches = plainText.match(/\S+/g);
  return matches ? matches.length : 0;
};
