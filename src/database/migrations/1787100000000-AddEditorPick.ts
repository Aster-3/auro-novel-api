import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEditorPick1787100000000 implements MigrationInterface {
  name = "AddEditorPick1787100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "editor_pick" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "novelId" uuid NOT NULL,
        "orderIndex" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_editor_pick_novelId" UNIQUE ("novelId"),
        CONSTRAINT "PK_editor_pick" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_editor_pick_novelId" ON "editor_pick" ("novelId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_editor_pick_orderIndex" ON "editor_pick" ("orderIndex")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_editor_pick_isActive" ON "editor_pick" ("isActive")`,
    );
    await queryRunner.query(`
      ALTER TABLE "editor_pick"
      ADD CONSTRAINT "FK_editor_pick_novel"
      FOREIGN KEY ("novelId") REFERENCES "novel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "editor_pick" DROP CONSTRAINT "FK_editor_pick_novel"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_editor_pick_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_editor_pick_orderIndex"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_editor_pick_novelId"`);
    await queryRunner.query(`DROP TABLE "editor_pick"`);
  }
}
