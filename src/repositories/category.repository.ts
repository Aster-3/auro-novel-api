import { ILike, Repository } from "typeorm";
import { Category } from "../entities/Category.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { UpdateCategoryDto } from "../schemas/update.category.schema.js";
import { SearchCategoryDto } from "../schemas/search.category.schema.js";
import { ICategoryRepository } from "../interfaces/categories.repo.interface.js";

export class CategoryRepository implements ICategoryRepository {
  constructor(private categoryRepo: Repository<Category>) {}

  async search(dto: SearchCategoryDto) {
    const { search, page, limit } = dto;
    const where = search ? { title: ILike(`%${search}%`) } : {};

    const [result, total] = await this.categoryRepo.findAndCount({
      where,
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPage = Math.ceil(total / limit);
    const nextPage = page < totalPage ? page + 1 : null;

    return {
      items: result as any[],
      total: total,
      nextPage: nextPage,
      currentPage: page,
      lastPage: totalPage,
    };
  }

  async create(dto: CreateCategoryDto) {
    await this.categoryRepo.save(dto);
  }

  async delete(categoryId: number) {
    await this.categoryRepo.delete({ id: categoryId });
  }

  async update(categoryId: number, dto: UpdateCategoryDto) {
    return await this.categoryRepo.update({ id: categoryId }, dto);
  }
}
