import { UpdateResult } from "typeorm";
import { Category } from "../entities/Category.js";
import { CreateCategoryDto } from "../schemas/create.category.schema.js";
import { SearchCategoryDto } from "./search.category.schema.js";

export interface ICategoryRepository {
  search(dto: SearchCategoryDto): Promise<Category[]>;
  create(dto: CreateCategoryDto): Promise<void>;
  delete(id: number): Promise<void>;
  update(id: number, dto: CreateCategoryDto): Promise<UpdateResult>;
}
