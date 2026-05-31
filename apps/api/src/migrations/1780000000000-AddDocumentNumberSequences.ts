import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentNumberSequences1780000000000 implements MigrationInterface {
    name = 'AddDocumentNumberSequences1780000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "invoice_number_seq" START WITH 1 INCREMENT BY 1`);
        await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "delivery_slip_number_seq" START WITH 1 INCREMENT BY 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SEQUENCE IF EXISTS "delivery_slip_number_seq"`);
        await queryRunner.query(`DROP SEQUENCE IF EXISTS "invoice_number_seq"`);
    }
}
