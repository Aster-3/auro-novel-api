import { ConflictError } from "../errors/conflict.error.js";
import { IAuthorService } from "../interfaces/author.service.interface.js";
import { IUnitOfWork } from "../interfaces/unit.of.work.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { QueryPageAndLimitDto } from "../schemas/queryPageAndLimitSchema.js";

export class AuthorService implements IAuthorService {
  constructor(private uow: IUnitOfWork) {}

  async createAuthor(dto: CreateAuthorDto, isAdmin: boolean): Promise<void> {
    const isAuthorExist = await this.uow.authorRepository.findByUserId(
      dto.userId,
    );
    if (isAuthorExist && !isAdmin) {
      throw new ConflictError("author", "Yazar zaten mevcut");
    }

    await this.uow.authorRepository.create(dto);
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.uow.authorRepository.delete(id);
  }

  async getAuthors(dto: any): Promise<any> {
    return await this.uow.authorRepository.getAuthors(dto);
  }

  async getAuthorStatus(userId: string) {
    return await this.uow.authorRepository.getStatusByUserId(userId);
  }

  async getMyNovels(userId: string, dto: QueryPageAndLimitDto) {
    return await this.uow.novelRepository.getNovelsByAuthorUserId(userId, dto);
  }
}
