import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const createTagSchema = z.object({
  body: z.object({
    name: reqString("Etiket adi")
      .min(3, "Etiket adi en az 3 karakter olmalidir")
      .max(30, "Etiket adi en fazla 30 karakter olmalidir"),
  }),
});

export type CreateTagDto = z.infer<typeof createTagSchema>["body"] & {
  userId: string;
};
