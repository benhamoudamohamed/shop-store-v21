import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginToModerator1778769479575 implements MigrationInterface {
    name = 'AddLastLoginToModerator1778769479575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "moderator" ADD "lastLogin" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "moderator" DROP COLUMN "lastLogin"`);
    }

}
