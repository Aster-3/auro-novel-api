import { LibraryController } from "../controllers/library.controller.js";
import { AppDataSource } from "../database/data-source.js";
import { Library } from "../entities/Library.js";
import { LibraryRepository } from "../repositories/library.repository.js";
import { LibraryService } from "../services/library.service.js";

export const getLibraryController = () => {
  const repo = AppDataSource.getRepository(Library);
  const libraryRepo = new LibraryRepository(repo);
  const libraryService = new LibraryService(libraryRepo);
  const libraryController = new LibraryController(libraryService);
  return libraryController;
};
