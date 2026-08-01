import { isPremiumActive } from "../utils/premium.status.js";

export class UserLoginResponseDto {
  id!: string;
  username!: string;
  nickname!: string;
  email!: string;
  profileImageUrl!: string | null;
  role!: string;
  authProvider!: string;
  showAdultContent!: boolean;
  adultContentConfirmedAt!: Date | null;
  termsAndPrivacyAcceptedAt!: Date | null;
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
      this.authProvider = data.authProvider || "local";
      this.showAdultContent = data.showAdultContent ?? false;
      this.adultContentConfirmedAt = data.adultContentConfirmedAt || null;
      this.termsAndPrivacyAcceptedAt = data.termsAndPrivacyAcceptedAt || null;
      this.premiumUntil = data.premiumUntil || null;
      this.isPremium = isPremiumActive(this.premiumUntil);
      this.subscriptionTier = data.subscriptionTier || null;
      this.subscriptionPeriod = data.subscriptionPeriod || null;
    }
  }
}
