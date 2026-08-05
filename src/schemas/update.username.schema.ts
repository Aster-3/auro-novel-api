import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const updateUsernameSchema = z.object({
  body: z
    .object({
      username: reqString("Kullanıcı adı")
        .min(4, "Kullanıcı adı en az 4 karakter olmalıdır")
        .max(15, "Kullanıcı adı en fazla 15 karakter olmalıdır")
        .regex(
          /^[a-z0-9_-]+$/,
          "Kullanıcı adı sadece küçük harf, rakam, alt çizgi ve tire içerebilir",
        ),
    })
    .strict(),
});

export type UpdateUsernameDto = z.infer<
  typeof updateUsernameSchema
>["body"];
