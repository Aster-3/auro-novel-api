import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChapterCommentNotificationTypes1786552800000
  implements MigrationInterface
{
  name = "AddChapterCommentNotificationTypes1786552800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."personal_notification_type_enum" ADD VALUE IF NOT EXISTS 'chapter_comment_reply'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."personal_notification_type_enum" ADD VALUE IF NOT EXISTS 'chapter_comment_like'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."personal_notification_targettype_enum" ADD VALUE IF NOT EXISTS 'chapter_comment'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ALTER COLUMN "targetType" TYPE text USING "targetType"::text`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ALTER COLUMN "type" TYPE text USING "type"::text`,
    );
    await queryRunner.query(
      `DELETE FROM "personal_notification" WHERE "type" IN ('chapter_comment_reply', 'chapter_comment_like') OR "targetType" = 'chapter_comment'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."personal_notification_targettype_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."personal_notification_targettype_enum" AS ENUM('novel', 'chapter', 'comment', 'reply', 'user', 'conversation', 'url')`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."personal_notification_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."personal_notification_type_enum" AS ENUM('new_chapter', 'comment_reply', 'comment_like', 'reply_reply', 'reply_like', 'follow', 'message')`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ALTER COLUMN "targetType" TYPE "public"."personal_notification_targettype_enum" USING "targetType"::"public"."personal_notification_targettype_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personal_notification" ALTER COLUMN "type" TYPE "public"."personal_notification_type_enum" USING "type"::"public"."personal_notification_type_enum"`,
    );
  }
}
