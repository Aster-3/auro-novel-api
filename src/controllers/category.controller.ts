import { Request, Response } from "express";
import { ICategoryService } from "../interfaces/categories.service.interface.js";

export class CategoryController {
  constructor(private categoryService: ICategoryService) {}

  searchCategories = async (req: Request, res: Response) => {
    const categories = await this.categoryService.searchCategories(
      res.locals.validatedData,
    );
    res.json(categories);
  };

  createCategory = async (req: Request, res: Response) => {
    await this.categoryService.createCategory(req.body);
    res.sendStatus(201);
  };

  deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.categoryService.deleteCategory(Number(id));
    res.sendStatus(204);
  };

  updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.categoryService.updateCategory(Number(id), req.body);
    res.sendStatus(204);
  };
}
