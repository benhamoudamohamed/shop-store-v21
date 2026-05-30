import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastLoginToAdmin1778769439609 implements MigrationInterface {
    name = 'AddLastLoginToAdmin1778769439609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin" ADD "lastLogin" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin" DROP COLUMN "lastLogin"`);
    }

}
