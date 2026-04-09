import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createAuthorSchema = z.object({
  body: z.object({
    nickname: reqString("Nickname boş bırakılamaz")
      .min(1, "Nickname boş bırakılamaz")
      .max(50, "Nickname en fazla 50 karakter olabilir")
      .optional(),
  }),
});

export type CreateAuthorDto = z.infer<typeof createAuthorSchema>["body"] & {
  userId: string;
};
