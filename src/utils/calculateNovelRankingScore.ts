/**
 * Novel sıralama puanını hesaplar.
 * @param {number} pos_reviews - Pozitif inceleme sayısı
 * @param {number} total_reviews - Toplam inceleme sayısı
 * @param {number} total_sales - Toplam satış sayısı (bölüm bazlı veya genel)
 * @returns {number} - Veritabanına kaydedilecek final_ranking_score
 */
export function calculateRankingScore(
  pos_reviews: number,
  total_reviews: number,
  total_sales: number,
): number {
  const wilson_score =
    total_reviews > 0 ? (pos_reviews + 1.92) / (total_reviews + 3.84) : 0;

  // 2. Satış Bonusu (Logaritmik Popülerlik)
  // Math.log10(1) = 0'dır, bu yüzden satış yoksa bonus 0 olur.
  const sales_bonus = Math.log10(total_sales + 1) * 0.01;

  // 3. Final Skor (4 basamak hassasiyet yeterlidir)
  const final_score = wilson_score + sales_bonus;

  return parseFloat(final_score.toFixed(4));
}
