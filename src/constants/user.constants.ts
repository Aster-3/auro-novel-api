export enum UserRoles {
  ADMIN = "admin",
  MODERATOR = "moderator",
  USER = "user",
}

export enum UserStatus {
  ACTIVE = "active",
  BANNED = "banned",
  DELETED = "deleted",
}

export enum UserAuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  MIXED = "mixed",
}

export enum UserGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum UserSubscriptionTier {
  TIER_1 = "tier_1",
  TIER_2 = "tier_2",
}

export enum UserSubscriptionPeriod {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}
