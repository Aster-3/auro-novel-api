import { ILike, Repository } from "typeorm";
import { Category } from "../entities/Category.js";
import { LanguageType } from "../constants/series.constants.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { SearchCategoryDto } from "../schemas/search.category.schema.js";
import { ICategoryRepository } from "../interfaces/categories.repo.interface.js";

export class CategoryRepository implements ICategoryRepository {
  constructor(private categoryRepo: Repository<Category>) {}

  async search(dto: SearchCategoryDto) {
    const { search, lang, page, limit } = dto;
    console.log("DTO:", dto);
    if (search === undefined || lang === undefined) {
      const [result, total] = await this.categoryRepo.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        data: result,
        count: total,
        currentPage: page,
        skip: (page - 1) * limit,
        take: limit,
        lastPage: Math.ceil(total / limit),
      };
    }

    const searchField = lang === LanguageType.EN ? "enName" : "trName";

    const [result, total] = await this.categoryRepo.findAndCount({
      where: {
        [searchField]: ILike(`%${search}%`),
      },
      order: { id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: result,
      count: total,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateCategoryDto) {
    await this.categoryRepo.save(dto);
  }

  async delete(categoryId: number) {
    await this.categoryRepo.delete({ id: categoryId });
  }

  async update(categoryId: number, dto: CreateCategoryDto) {
    return await this.categoryRepo.update({ id: categoryId }, dto);
  }
}
