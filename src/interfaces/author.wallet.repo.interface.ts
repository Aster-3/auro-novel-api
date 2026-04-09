import { AuthorWallet } from "../entities/_index.js";

export interface IAuthorWalletRepository {
  incrementTotalEarningsAndBalance(
    authorId: string,
    amount: number,
  ): Promise<number>;
  createWalletForAuthor(authorId: string): Promise<void>;
  getWalletByAuthorId(authorId: string): Promise<AuthorWallet | null>;
}
