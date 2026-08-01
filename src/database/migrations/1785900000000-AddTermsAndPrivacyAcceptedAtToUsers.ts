import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTermsAndPrivacyAcceptedAtToUsers1785900000000
  implements MigrationInterface
{
  name = "AddTermsAndPrivacyAcceptedAtToUsers1785900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "termsAndPrivacyAcceptedAt" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "termsAndPrivacyAcceptedAt"`,
    );
  }
}
