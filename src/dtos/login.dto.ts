export class UserLoginResponseDto {
  id!: string;
  username!: string;
  nickname!: string;
  email!: string;
  profileImageUrl!: string | null;
  role!: string;
  isPremium!: boolean;
  premiumUntil!: Date | null;
  subscriptionTier!: string | null;
  subscriptionPeriod!: string | null;

  constructor(data?: Partial<UserLoginResponseDto>) {
    if (data) {
      this.id = data.id || "";
      this.username = data.username || "";
      this.nickname = data.nickname || "Anonim";
      this.email! = data.email || "";
      this.profileImageUrl = data.profileImageUrl || null;
      this.role = data.role || "user";
      this.isPremium = data.isPremium || false;
      this.premiumUntil = data.premiumUntil || null;
      this.subscriptionTier = data.subscriptionTier || null;
      this.subscriptionPeriod = data.subscriptionPeriod || null;
    }
  }
}
