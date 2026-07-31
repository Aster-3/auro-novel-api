import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleAuthToUsers1785500000000 implements MigrationInterface {
  name = "AddGoogleAuthToUsers1785500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_auth_provider_enum" AS ENUM('local', 'google', 'mixed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "googleId" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "authProvider" "public"."user_auth_provider_enum" NOT NULL DEFAULT 'local'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_google_id_unique" ON "user" ("googleId") WHERE "googleId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_user_google_id_unique"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "authProvider"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`);
    await queryRunner.query(`DROP TYPE "public"."user_auth_provider_enum"`);
  }
}
