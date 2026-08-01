import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBlock1785700000000 implements MigrationInterface {
  name = "AddUserBlock1785700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_block" ("blockerId" uuid NOT NULL, "blockedId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_user_block_not_self" CHECK ("blockerId" <> "blockedId"), CONSTRAINT "PK_user_block" PRIMARY KEY ("blockerId", "blockedId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_block_blocker" ON "user_block" ("blockerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_block_blocked" ON "user_block" ("blockedId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_block" ADD CONSTRAINT "FK_user_block_blocker" FOREIGN KEY ("blockerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_block" ADD CONSTRAINT "FK_user_block_blocked" FOREIGN KEY ("blockedId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_block" DROP CONSTRAINT "FK_user_block_blocked"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_block" DROP CONSTRAINT "FK_user_block_blocker"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_block_blocked"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_block_blocker"`);
    await queryRunner.query(`DROP TABLE "user_block"`);
  }
}
