import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";

export const createAuthorSchema = z.object({
  body: z
    .object({
      nickname: reqString("Nickname boş bırakılamaz")
        .min(1, "Nickname boş bırakılamaz")
        .max(50, "Nickname en fazla 50 karakter olabilir")
        .optional(),
      userId: reqUuid("User ID").optional(),
    })
    .refine(
      (data) =>
        (data.userId && !data.nickname) || (!data.userId && data.nickname),
      {
        message:
          "Ya bir userId girmelisiniz ya da bir nickname. İkisini aynı anda veya ikisi de boş bırakılarak işlem yapılamaz.",
        path: ["nickname"],
      },
    ),
});

export type CreateAuthorDto = z.infer<typeof createAuthorSchema>["body"];
