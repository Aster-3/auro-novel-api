import { User } from "../entities/User.ts";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: User["username"];
        email: User["email"];
        role: User["role"];
        isPremium: User["isPremium"];
        premiumUntil: User["premiumUntil"];
        subscriptionTier: User["subscriptionTier"];
        subscriptionPeriod: User["subscriptionPeriod"];
      };
    }
  }
}
