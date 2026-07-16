import * as z from "zod";
import { reqUuid } from "../utils/zod.error.helper.js";

export const offlineChaptersSchema = z.object({
  params: z.object({
    id: reqUuid("Gecersiz novel ID formati"),
  }),
  body: z.object({
    chapterIds: z
      .array(reqUuid("Gecersiz bolum ID formati"))
      .min(1, "En az bir bolum ID gonderilmelidir.")
      .max(100, "Tek istekte en fazla 100 bolum indirilebilir."),
  }),
});

export type OfflineChaptersDto = z.infer<
  typeof offlineChaptersSchema
>["body"] & {
  id: string;
};
