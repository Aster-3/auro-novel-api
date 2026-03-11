import { TagController } from "../controllers/tag.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Tags } from "../entities/Tags.js";
import { TagRepository } from "../repositories/tag.repository.js";
import { TagService } from "../services/tag.service.js";

export const getTagController = () => {
  const tagtagRepo = new TagRepository(AppDataSource.getRepository(Tags));
  const tagService = new TagService(tagtagRepo);
  const tagController = new TagController(tagService);
  return tagController;
};
