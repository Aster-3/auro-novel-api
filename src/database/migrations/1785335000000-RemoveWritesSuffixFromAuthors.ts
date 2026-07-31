import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveWritesSuffixFromAuthors1785335000000
  implements MigrationInterface
{
  name = "RemoveWritesSuffixFromAuthors1785335000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "author" SET "nickname" = regexp_replace("nickname", ' Writes$', '') WHERE "nickname" LIKE '% Writes'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "author" SET "nickname" = "nickname" || ' Writes' WHERE "userId" IS NOT NULL AND "nickname" NOT LIKE '% Writes'`,
    );
  }
}
