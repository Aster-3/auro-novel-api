import { FindAndCountType } from "../constants/findAndCountType.js";
import { LanguageType } from "../constants/series.constants.js";
import { Category } from "../entities/Category.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { SearchCategoryDto } from "../schemas/search.category.schema.js";

export interface ICategoryService {
  searchCategories(dto: SearchCategoryDto): Promise<FindAndCountType<Category>>;
  createCategory(dto: CreateCategoryDto): Promise<void>;
  deleteCategory(id: number): Promise<void>;
  updateCategory(id: number, dto: CreateCategoryDto): Promise<void>;
}
