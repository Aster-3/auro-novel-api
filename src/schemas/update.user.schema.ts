import * as z from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(4, "Kullanıcı adı en az 4 karakter olabilir.")
      .max(15, "Kullanıcı adı en fazla 15 karakter olabilir.")
      .optional(),
    nickname: z
      .string()
      .min(4, "Takma ad en az 4 karakter olabilir.")
      .max(20, "Takma ad en fazla 20 karakter olabilir.")
      .optional(),
    email: z.email("Geçersiz e-posta formatı.").optional(),
    profileImageUrl: z.url("Geçersiz URL formatı.").optional(),
    profileBackgroundImageUrl: z.url("Geçersiz URL formatı.").optional(),
    description: z
      .string()
      .max(500, "Açıklama en fazla 500 karakter olabilir.")
      .optional(),
  }),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>["body"] & {
  id: string;
};
