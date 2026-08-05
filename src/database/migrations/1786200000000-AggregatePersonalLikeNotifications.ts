import { MigrationInterface, QueryRunner } from "typeorm";

export class AggregatePersonalLikeNotifications1786200000000
  implements MigrationInterface
{
  name = "AggregatePersonalLikeNotifications1786200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ADD "aggregationKey" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ADD "actorCount" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ADD "lastActivityAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ADD "lastPushedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `UPDATE "personal_notification" SET "lastActivityAt" = "createdAt"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_personal_notification_aggregation_key" ON "personal_notification" ("aggregationKey")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_personal_notification_user_activity" ON "personal_notification" ("userId", "lastActivityAt", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_personal_notification_user_activity"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_personal_notification_aggregation_key"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" DROP COLUMN "lastPushedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" DROP COLUMN "lastActivityAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" DROP COLUMN "actorCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" DROP COLUMN "aggregationKey"`,
    );
  }
}
