import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNovelWeeklyRankSnapshot1786800000000
  implements MigrationInterface
{
  name = "AddNovelWeeklyRankSnapshot1786800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "novel_weekly_rank_snapshot" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "novelId" uuid NOT NULL,
        "rankingScore" numeric(10,4) NOT NULL DEFAULT '0',
        "rank" integer NOT NULL,
        "recordedAt" date NOT NULL,
        CONSTRAINT "UQ_novel_weekly_rank_snapshot_novel_recorded" UNIQUE ("novelId", "recordedAt"),
        CONSTRAINT "PK_novel_weekly_rank_snapshot" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_novel_weekly_rank_snapshot_novelId" ON "novel_weekly_rank_snapshot" ("novelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_novel_weekly_rank_snapshot_recordedAt" ON "novel_weekly_rank_snapshot" ("recordedAt")`,
    );
    await queryRunner.query(`
      ALTER TABLE "novel_weekly_rank_snapshot"
      ADD CONSTRAINT "FK_novel_weekly_rank_snapshot_novel"
      FOREIGN KEY ("novelId") REFERENCES "novel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "novel_weekly_rank_snapshot" DROP CONSTRAINT "FK_novel_weekly_rank_snapshot_novel"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_novel_weekly_rank_snapshot_recordedAt"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_novel_weekly_rank_snapshot_novelId"`,
    );
    await queryRunner.query(`DROP TABLE "novel_weekly_rank_snapshot"`);
  }
}
