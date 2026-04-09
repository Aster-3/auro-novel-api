/**
 * Sezonluk ve bölüme özel indirimleri karşılaştırarak son fiyatı hesaplar.
 *
 *
 */

import { CoinType } from "../constants/transaction.contants.js";

interface DiscountConfig {
  percent: number | null;
  endDate: Date | null;
}

interface ChapterPrices {
  premiumPrice: number;
  freemiumPrice: number;
  discountRate: number | null;
  discountEndDate: Date | null;
}

export function calculateFinalAmount(
  chapter: ChapterPrices,
  seasonConfig: DiscountConfig,
  coinType: CoinType, // CoinType enum değerine göre güncelleyebilirsin
): number {
  // 1. Freemium kontrolü (SUN coin ise direkt freemium fiyatı döner)
  if (coinType === CoinType.SUN) {
    return chapter.freemiumPrice;
  }

  const now = new Date();

  // 2. Sezonluk indirim geçerlilik kontrolü
  const seasonalRate =
    seasonConfig.percent &&
    seasonConfig.percent > 0 &&
    seasonConfig.endDate &&
    seasonConfig.endDate > now
      ? seasonConfig.percent
      : 0;

  // 3. Bölüm indirim geçerlilik kontrolü
  const novelRate =
    chapter.discountRate &&
    chapter.discountRate > 0 &&
    chapter.discountEndDate &&
    chapter.discountEndDate > now
      ? chapter.discountRate
      : 0;

  // 4. En yüksek indirim oranını seç
  const finalDiscountRate = Math.max(seasonalRate, novelRate);

  // 5. Hesaplama
  if (finalDiscountRate <= 0) {
    return chapter.premiumPrice;
  }

  const discountedAmount = (chapter.premiumPrice * finalDiscountRate) / 100;
  const finalPrice = Math.ceil(chapter.premiumPrice - discountedAmount);

  // Fiyatın negatif olmamasını garanti et
  return Math.max(0, finalPrice);
}
