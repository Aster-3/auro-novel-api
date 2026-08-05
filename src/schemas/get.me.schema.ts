import * as z from "zod";

const UserFields = z.enum([
  "id",
  "username",
  "nickname",
  "email",
  "profileImageUrl",
  "profileBackgroundImageUrl",
  "description",
  "gender",
  "usernameChangedAt",
  "showAdultContent",
  "adultContentConfirmedAt",
  "termsAndPrivacyAcceptedAt",
  "authProvider",
  "isPremium",
  "premiumUntil",
  "subscriptionTier",
  "subscriptionPeriod",
]);

export const getMeSchema = z.object({
  query: z.object({
    fields: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === "") return [];
        return val.split(",").map((s) => s.trim());
      })
      .pipe(z.array(UserFields))
      .transform((arr) => {
        return arr.length > 0
          ? arr
          : [
              "id",
              "username",
              "nickname",
              "email",
              "profileImageUrl",
              "gender",
              "usernameChangedAt",
              "showAdultContent",
              "adultContentConfirmedAt",
              "termsAndPrivacyAcceptedAt",
              "authProvider",
              "isPremium",
              "premiumUntil",
              "subscriptionTier",
              "subscriptionPeriod",
            ];
      }),
  }),
});

export type GetMeQuery = z.infer<typeof getMeSchema>["query"] & {
  userId: string;
};
