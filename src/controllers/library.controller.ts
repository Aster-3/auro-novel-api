import { Request, Response } from "express";
import { ILibraryService } from "../interfaces/library.service.interface.js";

export class LibraryController {
  constructor(private libraryService: ILibraryService) {}

  addNovelToLibrary = async (req: Request, res: Response) => {
    const { novelId, userId } = req.body;
    await this.libraryService.addNovelToLibrary(novelId, userId);
    res.status(200).json({ message: "Novel added to library successfully" });
  };

  removeNovelFromLibrary = async (req: Request, res: Response) => {
    const { novelId, userId } = req.body;
    await this.libraryService.removeNovelFromLibrary(novelId, userId);
    res
      .status(200)
      .json({ message: "Novel removed from library successfully" });
  };
}
