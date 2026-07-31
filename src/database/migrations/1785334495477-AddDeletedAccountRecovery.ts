import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAccountRecovery1785334495477 implements MigrationInterface {
    name = 'AddDeletedAccountRecovery1785334495477'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "deleted_account_recovery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "emailHash" character(64) NOT NULL, "usernameHash" character(64) NOT NULL, "deletedAt" TIMESTAMP NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8e188fd4692b97c7d3ef1b7a0a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_663c6ce51b424953c8016503a6" ON "deleted_account_recovery" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2587ad31473018bd5dcb76a900" ON "deleted_account_recovery" ("expiresAt") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2587ad31473018bd5dcb76a900"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_663c6ce51b424953c8016503a6"`);
        await queryRunner.query(`DROP TABLE "deleted_account_recovery"`);
    }

}
