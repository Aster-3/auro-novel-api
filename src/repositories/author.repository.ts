import { Repository } from "typeorm";
import { IAuthorRepository } from "../interfaces/author.repo.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { Author } from "../entities/Author.js";
import { UpdateUserDto } from "../schemas/update.user.schema.js";

export class AuthorRepository implements IAuthorRepository {
  constructor(private authorRepo: Repository<Author>) {}

  async create(dto: CreateAuthorDto): Promise<string> {
    const author = await this.authorRepo.save(dto);
    return author.id;
  }

  async delete(id: string): Promise<void> {
    await this.authorRepo.delete(id);
  }

  async getAuthors(dto: any): Promise<any> {
    const { page, limit } = dto;
    const [result, total] = await this.authorRepo.findAndCount({
      skip: (page - 1) * limit,
      select: {
        id: true,
        nickname: true,
        user: {
          id: true,
          nickname: true,
        },
        isVerified: true,
      },
      take: limit,
      relations: {
        user: true,
      },
    });
    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  findByUserId = async (userId: string): Promise<Author | null> => {
    const author = await this.authorRepo.findOne({
      where: { userId },
    });
    if (!author) {
      return null;
    }
    return author;
  };
}
