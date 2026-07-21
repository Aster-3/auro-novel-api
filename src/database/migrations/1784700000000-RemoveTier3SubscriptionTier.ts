import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTier3SubscriptionTier1784700000000
  implements MigrationInterface
{
  name = "RemoveTier3SubscriptionTier1784700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "user" SET "subscriptionTier" = NULL WHERE "subscriptionTier" = 'tier_3'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_tier_enum" RENAME TO "user_subscription_tier_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_tier_enum" AS ENUM('tier_1', 'tier_2')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "subscriptionTier" TYPE "public"."user_subscription_tier_enum" USING "subscriptionTier"::"text"::"public"."user_subscription_tier_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_tier_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_tier_enum" RENAME TO "user_subscription_tier_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_tier_enum" AS ENUM('tier_1', 'tier_2', 'tier_3')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "subscriptionTier" TYPE "public"."user_subscription_tier_enum" USING "subscriptionTier"::"text"::"public"."user_subscription_tier_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_tier_enum_old"`,
    );
  }
}
