import { UpdateResult } from "typeorm";
import { Category } from "../entities/Category.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { UpdateCategoryDto } from "../schemas/update.category.schema.js";
import { SearchCategoryDto } from "../schemas/search.category.schema.js";
import { FindAndCountType } from "../constants/findAndCountType.js";

export interface ICategoryRepository {
  search(dto: SearchCategoryDto): Promise<FindAndCountType<Category>>;
  create(dto: CreateCategoryDto): Promise<void>;
  delete(id: number): Promise<void>;
  update(id: number, dto: UpdateCategoryDto): Promise<UpdateResult>;
}
