export function isPremiumActive(premiumUntil?: Date | string | null) {
  if (!premiumUntil) return false;
  return new Date(premiumUntil).getTime() > Date.now();
}

export function withPremiumStatus<T extends { premiumUntil?: Date | string | null }>(
  user: T,
) {
  return {
    ...user,
    isPremium: isPremiumActive(user.premiumUntil),
  };
}
