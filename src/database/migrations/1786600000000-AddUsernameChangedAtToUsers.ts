import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsernameChangedAtToUsers1786600000000
  implements MigrationInterface
{
  name = "AddUsernameChangedAtToUsers1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "usernameChangedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "usernameChangedAt"`,
    );
  }
}
