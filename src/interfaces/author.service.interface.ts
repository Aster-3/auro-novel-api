import { FindAndCountType } from "../constants/findAndCountType.js";
import { Author } from "../entities/_index.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { GetAuthorsDto } from "../schemas/get.authors.schema.js";
import { GetAuthorTransactionsDto } from "../schemas/get.author.transactions.schema.js";

export interface IAuthorService {
  createAuthor(dto: CreateAuthorDto, isAdmin: boolean): Promise<void>;
  deleteAuthor(id: string): Promise<void>;
  getAuthors(dto: GetAuthorsDto): Promise<FindAndCountType<Author>>;
  getAuthorWallet(authorId: string): Promise<{
    totalEarnings: number;
    withdrawableBalance: number;
    pendingWithdrawalBalance: number;
    canWithdrawAfter: Date;
  }>;
  getAuthorTransactions(
    dto: GetAuthorTransactionsDto,
    userId: string,
  ): Promise<FindAndCountType<any>>;
}
