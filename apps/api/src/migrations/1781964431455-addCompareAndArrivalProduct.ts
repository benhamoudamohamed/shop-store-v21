import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompareAndArrivalProduct1781964431455 implements MigrationInterface {
    name = 'AddCompareAndArrivalProduct1781964431455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ADD "isNewArrival" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "product" ADD "compareAtPrice" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "compareAtPrice"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "isNewArrival"`);
    }

}
