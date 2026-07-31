import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedUserStatus1785328149130 implements MigrationInterface {
    name = 'AddDeletedUserStatus1785328149130'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_status_enum" ADD VALUE 'deleted'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "user" SET "status" = 'pending' WHERE "status" = 'deleted'`);
        await queryRunner.query(`CREATE TYPE "public"."user_status_enum_old" AS ENUM('active', 'pending', 'banned')`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" TYPE "public"."user_status_enum_old" USING "status"::"text"::"public"."user_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."user_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_status_enum_old" RENAME TO "user_status_enum"`);
    }

}
