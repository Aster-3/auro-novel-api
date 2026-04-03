import { DataSource, Repository } from "typeorm";
import { ChapterPurchase, Novel } from "../entities/_index.js";
import { CreateChapterPurchaseDTO } from "../schemas/create.chapter.purchase.schema.js";
import { IChapterPurchaseRepository } from "../interfaces/chapter.purchase.repo.interface.js";

export class ChapterPurchaseRepository implements IChapterPurchaseRepository {
  constructor(
    private chapterPurchaseRepo: Repository<ChapterPurchase>,
    private dataSource: DataSource,
  ) {}

  async getAllChapterPurchases() {
    return await this.chapterPurchaseRepo.find({
      select: {
        id: true,
        userId: true,
        chapterId: true,
        user: {
          id: true,
          nickname: true,
        },
        chapter: {
          id: true,
          title: true,
          orderIndex: true,
          novel: {
            id: true,
            name: true,
          },
        },
      },
      relations: {
        user: true,
        chapter: {
          novel: true,
        },
      },
    });
  }

  async createChapterPurchase(dto: CreateChapterPurchaseDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await queryRunner.manager.save(ChapterPurchase, dto);

      await queryRunner.manager
        .createQueryBuilder()
        .update(Novel)
        .set({ purchaseCount: () => "purchaseCount + 1" })
        .where('id = (SELECT "novelId" FROM chapter WHERE id = :chapterId)', {
          chapterId: dto.chapterId,
        })
        .execute();

      await queryRunner.commitTransaction();
      return !!result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async hasPurchasedChapterByUserId(userId: string, chapterId: string) {
    return await this.chapterPurchaseRepo.exists({
      where: {
        userId: userId,
        chapterId: chapterId,
      },
    });
  }

  async isChapterEverPurchased(chapterId: string): Promise<boolean> {
    return await this.chapterPurchaseRepo.exists({
      where: {
        chapterId: chapterId,
      },
    });
  }
}
