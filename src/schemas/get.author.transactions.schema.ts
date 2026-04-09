import * as z from "zod";
import { AuthorTransactionType } from "../constants/transaction.contants.js";

export const getAuthorTransactionsSchema = z.object({
  query: z.object({
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
    filterBy: z
      .enum(AuthorTransactionType, {
        message: "Geçersiz işlem türü.",
      })
      .optional(),
    since: z.coerce // .coerce kullanarak string'i Date objesine çeviriyoruz
      .date({
        error: () => ({ message: "Geçersiz tarih formatı." }),
      })
      .optional(),
  }),
});

export type GetAuthorTransactionsDto = z.infer<
  typeof getAuthorTransactionsSchema
>["query"] & {
  walletId: string;
};
