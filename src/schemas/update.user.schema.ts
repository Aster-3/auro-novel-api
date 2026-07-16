import * as z from "zod";
import { UserGender } from "../constants/user.constants.js";

export const updateUserSchema = z.object({
  body: z.object({
    nickname: z
      .string()
      .min(4, "Takma ad en az 4 karakter olabilir.")
      .max(20, "Takma ad en fazla 20 karakter olabilir.")
      .optional(),
    profileImageUrl: z.url("Geçersiz URL formatı.").optional(),
    profileBackgroundImageUrl: z.url("Geçersiz URL formatı.").optional(),
    description: z
      .string()
      .max(500, "Açıklama en fazla 500 karakter olabilir.")
      .optional(),
    gender: z.enum(UserGender).nullable().optional(),
  }),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>["body"] & {
  id: string;
};
