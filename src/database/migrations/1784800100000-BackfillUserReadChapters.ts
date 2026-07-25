import { MigrationInterface, QueryRunner } from "typeorm";

export class BackfillUserReadChapters1784800100000
  implements MigrationInterface
{
  name = "BackfillUserReadChapters1784800100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "user_read_chapter" ("userId", "novelId", "chapterId")
       SELECT "userId", "novelId", "lastReadChapterId"
       FROM "reading_stats"
       WHERE "lastChapterProgress" > 50 OR ("lastChapterProgress" <= 1 AND "lastChapterProgress" > 0.5)
       ON CONFLICT ("userId", "novelId", "chapterId") DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_read_chapter"
       WHERE EXISTS (
         SELECT 1
         FROM "reading_stats"
         WHERE "reading_stats"."userId" = "user_read_chapter"."userId"
           AND "reading_stats"."novelId" = "user_read_chapter"."novelId"
           AND "reading_stats"."lastReadChapterId" = "user_read_chapter"."chapterId"
           AND (
             "reading_stats"."lastChapterProgress" > 50
             OR (
               "reading_stats"."lastChapterProgress" <= 1
               AND "reading_stats"."lastChapterProgress" > 0.5
             )
           )
       )`,
    );
  }
}
