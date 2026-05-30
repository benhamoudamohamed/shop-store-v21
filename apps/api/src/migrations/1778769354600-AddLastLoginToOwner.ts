import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginToOwner1778769354600 implements MigrationInterface {
    name = 'AddLastLoginToOwner1778769354600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" ADD "lastLogin" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "owner" DROP COLUMN "lastLogin"`);
    }

}
