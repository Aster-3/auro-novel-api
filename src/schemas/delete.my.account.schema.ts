import * as z from "zod";
import { reqString } from "../utils/zod.error.helper.js";

export const deleteMyAccountSchema = z.object({
  body: z.object({
    password: reqString("Sifre")
      .min(8, "Sifre en az 8 karakter olmalidir")
      .max(255, "Sifre en fazla 255 karakter olmalidir"),
    confirmation: reqString("Onay metni").refine(
      (value) => value === "ONAYLIYORUM",
      'Onay metni "ONAYLIYORUM" olmalidir',
    ),
  }),
});

export type DeleteMyAccountDto = z.infer<
  typeof deleteMyAccountSchema
>["body"];
