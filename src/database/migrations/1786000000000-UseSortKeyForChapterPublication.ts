import { MigrationInterface, QueryRunner } from "typeorm";

export class UseSortKeyForChapterPublication1786000000000
  implements MigrationInterface
{
  name = "UseSortKeyForChapterPublication1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_61daf00a4291fc25984f5ed94e"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_0b9320e264b5049499dce7a935"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" RENAME COLUMN "orderIndex" TO "sortKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" ALTER COLUMN "sortKey" TYPE numeric(12,4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" ALTER COLUMN "sortKey" SET DEFAULT '1000'`,
    );
    await queryRunner.query(
      `UPDATE "chapter_publication" SET "sortKey" = "sortKey" * 1000`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" DROP COLUMN IF EXISTS "publicationStatus"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."chapter_publication_publicationstatus_enum"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_chapter_publication_volume_sort_key" ON "chapter_publication" ("volumeId", "sortKey")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_chapter_publication_volume_sort_key"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."chapter_publication_publicationstatus_enum" AS ENUM('published', 'unpublished')`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" ADD "publicationStatus" "public"."chapter_publication_publicationstatus_enum" NOT NULL DEFAULT 'published'`,
    );
    await queryRunner.query(
      `UPDATE "chapter_publication" SET "sortKey" = "sortKey" / 1000`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" ALTER COLUMN "sortKey" TYPE numeric(6,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" ALTER COLUMN "sortKey" SET DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "chapter_publication" RENAME COLUMN "sortKey" TO "orderIndex"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0b9320e264b5049499dce7a935" ON "chapter_publication" ("publicationStatus")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_61daf00a4291fc25984f5ed94e" ON "chapter_publication" ("volumeId", "orderIndex")`,
    );
  }
}
