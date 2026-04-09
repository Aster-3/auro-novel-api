import { FindAndCountType } from "../constants/findAndCountType.js";
import { Author } from "../entities/Author.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { GetAuthorsDto } from "../schemas/get.authors.schema.js";

export interface IAuthorRepository {
  create(dto: CreateAuthorDto): Promise<string>;
  delete(id: string): Promise<void>;
  getAuthors(dto: GetAuthorsDto): Promise<FindAndCountType<Author>>;
  findByUserId(userId: string): Promise<Author | null>;
  existControlAuthorId(authorId: string): Promise<Author | null>;
  getAuthorWalletByUserId(userId: string): Promise<Author | null>;
}
