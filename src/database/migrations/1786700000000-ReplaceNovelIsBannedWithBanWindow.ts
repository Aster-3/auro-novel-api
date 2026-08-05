import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceNovelIsBannedWithBanWindow1786700000000
  implements MigrationInterface
{
  name = "ReplaceNovelIsBannedWithBanWindow1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "novel" ADD "bannedUntil" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "novel" ADD "banReason" character varying(500)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_novel_bannedUntil" ON "novel" ("bannedUntil")`,
    );

    await queryRunner.query(`
      UPDATE "novel"
      SET
        "bannedUntil" = '9999-12-31 23:59:59',
        "banReason" = 'Migrated from legacy isBanned flag'
      WHERE "isBanned" = true
    `);

    await queryRunner.query(`ALTER TABLE "novel" DROP COLUMN "isBanned"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "novel" ADD "isBanned" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`
      UPDATE "novel"
      SET "isBanned" = true
      WHERE "bannedUntil" IS NOT NULL AND "bannedUntil" > NOW()
    `);

    await queryRunner.query(`DROP INDEX "public"."IDX_novel_bannedUntil"`);
    await queryRunner.query(`ALTER TABLE "novel" DROP COLUMN "banReason"`);
    await queryRunner.query(`ALTER TABLE "novel" DROP COLUMN "bannedUntil"`);
  }
}
