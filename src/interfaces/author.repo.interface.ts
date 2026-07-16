import { FindAndCountType } from "../constants/findAndCountType.js";
import { Author } from "../entities/Author.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { GetAuthorsDto } from "../schemas/get.authors.schema.js";

export type AuthorStatus = {
  isAuthor: boolean;
  authorId: string | null;
  nickname: string | null;
  isVerified: boolean;
};

export interface IAuthorRepository {
  create(dto: CreateAuthorDto): Promise<string>;
  delete(id: string): Promise<void>;
  getAuthors(dto: GetAuthorsDto): Promise<FindAndCountType<Author>>;
  findByUserId(userId: string): Promise<Author | null>;
  getStatusByUserId(userId: string): Promise<AuthorStatus>;
  existControlAuthorId(authorId: string): Promise<Author | null>;
}
