import { ConflictError } from "../errors/conflict.error.js";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { IAuthorService } from "../interfaces/author.service.interface.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";

export class AuthorService implements IAuthorService {
  constructor(
    private authorRepo: IAuthorRepository,
    private userRepository: IUserRepository,
  ) {}

  async createAuthor(dto: CreateAuthorDto): Promise<void> {
    if (dto.userId) {
      const user = await this.userRepository.exsistById(dto.userId);
      if (!user) {
        throw new ConflictError("User Id", "Kullanıcı bulunamadı");
      }
    }
    await this.authorRepo.create(dto);
  }

  async deleteAuthor(id: string): Promise<void> {
    await this.authorRepo.delete(id);
  }

  async getAuthors(dto: any): Promise<any> {
    return await this.authorRepo.getAuthors(dto);
  }
}
