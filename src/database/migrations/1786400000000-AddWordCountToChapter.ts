import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWordCountToChapter1786400000000 implements MigrationInterface {
  name = "AddWordCountToChapter1786400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chapter" ADD "wordCount" integer NOT NULL DEFAULT 0`,
    );

    await queryRunner.query(`
      WITH cleaned AS (
        SELECT
          "id",
          trim(
            regexp_replace(
              regexp_replace(
                regexp_replace("content", '<[^>]*>', ' ', 'g'),
                '&nbsp;|&#160;',
                ' ',
                'gi'
              ),
              '\\s+',
              ' ',
              'g'
            )
          ) AS plain_text
        FROM "chapter"
      )
      UPDATE "chapter"
      SET "wordCount" = CASE
        WHEN cleaned.plain_text = '' THEN 0
        ELSE array_length(regexp_split_to_array(cleaned.plain_text, '\\s+'), 1)
      END
      FROM cleaned
      WHERE "chapter"."id" = cleaned."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "chapter" DROP COLUMN "wordCount"`);
  }
}
