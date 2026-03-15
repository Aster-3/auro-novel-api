import { ConflictError } from "../errors/conflict.error.js";
import { NotFoundError } from "../errors/not.found.error.js";
import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";
import { IChapterPurchaseService } from "../interfaces/chapter.purchase.service.interface.js";
import { IChapterRepository } from "../interfaces/chapter.repo.interface.js";
import { INovelRepository } from "../interfaces/novel.repo.interface.js";
import { IUserRepository } from "../interfaces/user.repo.interface.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";

export class ChapterPurchaseService implements IChapterPurchaseService {
  constructor(
    private chapterPurchaseRepository: IChapterPurchaseRepository,
    private userRepository: IUserRepository,
    private chapterRepository: IChapterRepository,
  ) {}

  async getAllChapterPurchases() {
    return await this.chapterPurchaseRepository.getAllChapterPurchases();
  }

  async createChapterPurchase(dto: CreateChapterPurchaseDTO) {
    const userExists = await this.userRepository.exsistById(dto.userId);
    if (!userExists) {
      throw new NotFoundError("User not found");
    }
    const isLocked = await this.chapterRepository.getLockStatus(dto.chapterId);
    if (isLocked === null) {
      throw new NotFoundError("Bölüm mevcut değil.");
    }

    if (isLocked === false) {
      throw new ConflictError(
        "Bölüm ID",
        "Zaten ücretsiz olan bir bölümü satın alamazsın.",
      );
    }

    const hasPurchased =
      await this.chapterPurchaseRepository.hasPurchasedChapter(
        dto.userId,
        dto.chapterId,
      );

    if (hasPurchased) {
      throw new ConflictError("Bölüm ID", "Bu bölümü zaten satın aldınız.");
    }

    return await this.chapterPurchaseRepository.createChapterPurchase(dto);
  }
}
