import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdultContentConfirmationToUsers1785800000000
  implements MigrationInterface
{
  name = "AddAdultContentConfirmationToUsers1785800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "adultContentConfirmedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "adultContentConfirmedAt"`,
    );
  }
}
