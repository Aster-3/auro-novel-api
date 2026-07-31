import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIsPremiumFromUser1785328539544 implements MigrationInterface {
    name = 'RemoveIsPremiumFromUser1785328539544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isPremium"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "isPremium" boolean NOT NULL DEFAULT false`);
    }

}
