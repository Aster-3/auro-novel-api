import * as z from "zod";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import { CommentSortType } from "../constants/comment.constants.js";

export const searchCommentSchema = z.object({
  query: z.object({
    sort: z
      .enum(CommentSortType, {
        message: "Geçersiz sıralama türü. 'newest' veya 'oldest' olmalıdır.",
      })
      .optional(),
    page: z.coerce
      .number()
      .min(1, "Sayfa numarası 1'den küçük olamaz")
      .optional()
      .default(1),
    limit: z.coerce
      .number()
      .min(1, "Limit en az 1 olmalıdır.")
      .max(100, "Tek seferde en fazla 100 kayıt çekebilirsiniz.")
      .optional()
      .default(20),
    role: z.enum(UserRoles, { message: "Geçersiz kullanıcı rolü" }).optional(),
    status: z
      .enum(UserStatus, { message: "Geçersiz kullanıcı durumu" })
      .optional(),
  }),
});

export type SearchCommentsDto = z.infer<typeof searchCommentSchema>["query"];
