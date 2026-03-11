import { ILike, Repository } from "typeorm";
import { Category } from "../entities/Category.js";
import { LanguageType } from "../constants/series.constants.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { SearchCategoryDto } from "../interfaces/search.category.schema.js";

export class CategoryRepository {
  constructor(private categoryRepo: Repository<Category>) {}

  search(dto: SearchCategoryDto) {
    const { search, lang } = dto;
    if (search === undefined || lang === undefined) {
      return this.categoryRepo.find();
    }

    const searchField = lang === LanguageType.EN ? "enName" : "trName";

    return this.categoryRepo.find({
      where: {
        [searchField]: ILike(`%${search}%`),
      },
      order: { id: "DESC" },
    });
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
