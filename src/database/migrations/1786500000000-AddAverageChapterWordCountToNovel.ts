import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAverageChapterWordCountToNovel1786500000000
  implements MigrationInterface
{
  name = "AddAverageChapterWordCountToNovel1786500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "novel" ADD "averageChapterWordCount" integer`,
    );

    await queryRunner.query(`
      UPDATE "novel"
      SET "averageChapterWordCount" = stats.average_word_count
      FROM (
        SELECT
          ch."novelId" AS novel_id,
          ROUND(AVG(ch."wordCount"))::integer AS average_word_count
        FROM "chapter_publication" pub
        INNER JOIN "chapter" ch ON ch."id" = pub."chapterId"
        GROUP BY ch."novelId"
      ) stats
      WHERE "novel"."id" = stats.novel_id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "novel" DROP COLUMN "averageChapterWordCount"`,
    );
  }
}
