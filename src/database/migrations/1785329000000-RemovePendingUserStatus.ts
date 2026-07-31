import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePendingUserStatus1785329000000 implements MigrationInterface {
  name = "RemovePendingUserStatus1785329000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user" SET "status" = 'active' WHERE "status" = 'pending'`);
    await queryRunner.query(`ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'banned', 'deleted')`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "status" TYPE "public"."user_status_enum" USING "status"::"text"::"public"."user_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'active'`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."user_status_enum" RENAME TO "user_status_enum_old"`);
    await queryRunner.query(`CREATE TYPE "public"."user_status_enum" AS ENUM('active', 'pending', 'banned', 'deleted')`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "status" TYPE "public"."user_status_enum" USING "status"::"text"::"public"."user_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'pending'`);
    await queryRunner.query(`DROP TYPE "public"."user_status_enum_old"`);
  }
}
