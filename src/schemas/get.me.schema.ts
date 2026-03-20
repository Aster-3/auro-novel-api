import * as z from "zod";

const UserFields = z.enum([
  "username",
  "nickname",
  "email",
  "profileImageUrl",
  "profileBackgroundImageUrl",
  "description",
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
          : ["id", "username", "nickname", "email", "profileImageUrl"];
      }),
  }),
});

export type GetMeQuery = z.infer<typeof getMeSchema>["query"] & {
  userId: string;
};
