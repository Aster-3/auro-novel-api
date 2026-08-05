import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyGlobalNotifications1786100000000
  implements MigrationInterface
{
  name = "SimplifyGlobalNotifications1786100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "global_notification" ALTER COLUMN "content" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_notification" ADD "targetUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_notification" DROP COLUMN "priority"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "global_notification" ADD "priority" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `UPDATE "global_notification" SET "content" = '' WHERE "content" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_notification" ALTER COLUMN "content" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "global_notification" DROP COLUMN "targetUrl"`,
    );
  }
}
