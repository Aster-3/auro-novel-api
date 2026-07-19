import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeedbackReportType1784419341615 implements MigrationInterface {
    name = 'AddFeedbackReportType1784419341615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."feedback_submission_type_enum" RENAME TO "feedback_submission_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."feedback_submission_type_enum" AS ENUM('support', 'feedback', 'suggestion', 'report', 'other')`);
        await queryRunner.query(`ALTER TABLE "feedback_submission" ALTER COLUMN "type" TYPE "public"."feedback_submission_type_enum" USING "type"::"text"::"public"."feedback_submission_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_submission_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."feedback_submission_type_enum_old" AS ENUM('support', 'feedback', 'suggestion', 'other')`);
        await queryRunner.query(`ALTER TABLE "feedback_submission" ALTER COLUMN "type" TYPE "public"."feedback_submission_type_enum_old" USING "type"::"text"::"public"."feedback_submission_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_submission_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."feedback_submission_type_enum_old" RENAME TO "feedback_submission_type_enum"`);
    }

}
