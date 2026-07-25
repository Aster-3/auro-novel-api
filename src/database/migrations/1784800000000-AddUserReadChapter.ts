import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserReadChapter1784800000000 implements MigrationInterface {
  name = "AddUserReadChapter1784800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_read_chapter" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "novelId" uuid NOT NULL, "chapterId" uuid NOT NULL, CONSTRAINT "UQ_user_read_chapter_user_novel_chapter" UNIQUE ("userId", "novelId", "chapterId"), CONSTRAINT "PK_user_read_chapter_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_read_chapter_userId" ON "user_read_chapter" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_read_chapter_novelId" ON "user_read_chapter" ("novelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_read_chapter_chapterId" ON "user_read_chapter" ("chapterId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" ADD CONSTRAINT "FK_user_read_chapter_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" ADD CONSTRAINT "FK_user_read_chapter_novel" FOREIGN KEY ("novelId") REFERENCES "novel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" ADD CONSTRAINT "FK_user_read_chapter_chapter" FOREIGN KEY ("chapterId", "novelId") REFERENCES "chapter"("id","novelId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" DROP CONSTRAINT "FK_user_read_chapter_chapter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" DROP CONSTRAINT "FK_user_read_chapter_novel"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_read_chapter" DROP CONSTRAINT "FK_user_read_chapter_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_user_read_chapter_chapterId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_read_chapter_novelId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_read_chapter_userId"`);
    await queryRunner.query(`DROP TABLE "user_read_chapter"`);
  }
}
