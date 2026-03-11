import * as z from "zod";
import { LanguageType } from "../constants/series.constants.js";

export const searchCategorySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    lang: z.enum(LanguageType, "Geçersiz dil").optional(),
  }),
});

export type SearchCategoryDto = z.infer<typeof searchCategorySchema>["query"];
