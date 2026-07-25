import { Repository } from "typeorm";
import {
  IUserReadChapterRepository,
  ReadProgressByNovel,
} from "../interfaces/user.read.chapter.repo.interface.js";
import { UserReadChapter } from "../entities/UserReadChapter.js";

export class UserReadChapterRepository implements IUserReadChapterRepository {
  constructor(private readonly readChapterRepo: Repository<UserReadChapter>) {}

  async markChapterAsRead(dto: {
    userId: string;
    novelId: string;
    chapterId: string;
  }): Promise<void> {
    await this.readChapterRepo
      .createQueryBuilder()
      .insert()
      .into(UserReadChapter)
      .values(dto)
      .orIgnore()
      .execute();
  }

  async getReadProgressByUserId(
    userId: string,
  ): Promise<Map<string, ReadProgressByNovel>> {
    const rows = await this.readChapterRepo
      .createQueryBuilder("readChapter")
      .select("readChapter.novelId", "novelId")
      .addSelect("COUNT(readChapter.chapterId)", "readChapterCount")
      .where("readChapter.userId = :userId", { userId })
      .groupBy("readChapter.novelId")
      .getRawMany<{ novelId: string; readChapterCount: string }>();

    return new Map(
      rows.map((row) => [
        row.novelId,
        {
          novelId: row.novelId,
          readChapterCount: Number(row.readChapterCount),
        },
      ]),
    );
  }
}
