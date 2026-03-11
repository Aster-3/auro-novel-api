import * as z from "zod";
import { reqString, reqUuid } from "../utils/zod.error.helper.js";
import { LanguageType } from "../constants/series.constants.js";

export const createTagSchema = z.object({
  body: z.object({
    name: reqString("Etiket adı")
      .min(3, "Etiket adı en az 3 karakter olmalıdır")
      .max(30, "Etiket adı en fazla 30 karakter olmalıdır"),
    language: z.enum(LanguageType, "Dil türü geçersiz"),
    userId: reqUuid("Kullanıcı id'si"),
  }),
});

export type CreateTagDto = z.infer<typeof createTagSchema>["body"];
