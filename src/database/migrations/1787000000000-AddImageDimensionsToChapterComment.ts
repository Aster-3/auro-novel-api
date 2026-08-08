import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageDimensionsToChapterComment1787000000000
  implements MigrationInterface
{
  name = "AddImageDimensionsToChapterComment1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" ADD "imageWidth" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" ADD "imageHeight" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" DROP COLUMN "imageHeight"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_comment" DROP COLUMN "imageWidth"`,
    );
  }
}
