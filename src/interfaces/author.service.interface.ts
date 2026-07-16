import { FindAndCountType } from "../constants/findAndCountType.js";
import { Author } from "../entities/_index.js";
import { AuthorStatus } from "./author.repo.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { GetAuthorsDto } from "../schemas/get.authors.schema.js";
import { NovelListItem } from "./novel.repo.interface.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";

export interface IAuthorService {
  createAuthor(dto: CreateAuthorDto, isAdmin: boolean): Promise<void>;
  deleteAuthor(id: string): Promise<void>;
  getAuthors(dto: GetAuthorsDto): Promise<FindAndCountType<Author>>;
  getAuthorStatus(userId: string): Promise<AuthorStatus>;
  getMyNovels(
    userId: string,
    dto: QueryPageAndLimitDto,
  ): Promise<FindAndCountType<NovelListItem>>;
}
