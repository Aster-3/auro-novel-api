export function calculateRankingScore(
  pos_reviews: number,
  total_reviews: number,
): number {
  const wilsonScore =
    total_reviews > 0 ? (pos_reviews + 1.92) / (total_reviews + 3.84) : 0;

  return parseFloat(wilsonScore.toFixed(4));
}
