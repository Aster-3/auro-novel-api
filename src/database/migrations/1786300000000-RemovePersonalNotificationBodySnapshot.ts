import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePersonalNotificationBodySnapshot1786300000000
  implements MigrationInterface
{
  name = "RemovePersonalNotificationBodySnapshot1786300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_notification" DROP COLUMN "bodySnapshot"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ADD "bodySnapshot" character varying(500)`,
    );
  }
}
