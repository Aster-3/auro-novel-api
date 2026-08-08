import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToChapterComment1786900000000
  implements MigrationInterface
{
  name = "AddImageUrlToChapterComment1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" ADD "imageUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" DROP COLUMN "imageUrl"`,
    );
  }
}
