import { Repository } from "typeorm";
import {
  AuthorStatus,
  IAuthorRepository,
} from "../interfaces/author.repo.interface.js";
import { CreateAuthorDto } from "../schemas/create.author.schmea.js";
import { Author } from "../entities/Author.js";

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
        userId: true,
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

  async getStatusByUserId(userId: string): Promise<AuthorStatus> {
    const author = await this.authorRepo.findOne({
      where: { userId },
      select: {
        id: true,
        nickname: true,
        isVerified: true,
      },
    });

    return {
      isAuthor: Boolean(author),
      authorId: author?.id ?? null,
      nickname: author?.nickname ?? null,
      isVerified: author?.isVerified ?? false,
    };
  }

  async existControlAuthorId(authorId: string) {
    const author = await this.authorRepo.findOne({
      where: { id: authorId },
    });
    if (!author) {
      return null;
    }
    return author;
  }
}
