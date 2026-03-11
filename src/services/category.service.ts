import { LanguageType } from "../constants/series.constants.js";
import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { ICategoryRepository } from "../interfaces/categories.repo.interface.js";
import { ICategoryService } from "../interfaces/categories.service.interface.js";
import { SearchCategoryDto } from "../interfaces/search.category.schema.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";

export class CategoryService implements ICategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  async searchCategories(dto: SearchCategoryDto) {
    return this.categoryRepository.search(dto);
  }

  async createCategory(dto: CreateCategoryDto): Promise<void> {
    await this.categoryRepository.create(dto);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categoryRepository.delete(id);
  }

  async updateCategory(id: number, dto: CreateCategoryDto): Promise<void> {
    const result = await this.categoryRepository.update(id, dto);
    console.log("Update Res:", dto, id);
    if (result.affected === 0) {
      throw new NotFoundError("Güncellenmek istenen kategori bulunamadı.");
    }
  }
}
