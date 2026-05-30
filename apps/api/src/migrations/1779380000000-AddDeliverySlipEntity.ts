import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeliverySlipEntity1779380000000 implements MigrationInterface {
    name = 'AddDeliverySlipEntity1779380000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "delivery_slip" ("id" SERIAL NOT NULL, "slipNumber" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "purchaseId" integer, CONSTRAINT "UQ_1e1e39f3d59f88d1ce40c9f054f" UNIQUE ("slipNumber"), CONSTRAINT "REL_80b724cb8111d8a5d1b775da7f" UNIQUE ("purchaseId"), CONSTRAINT "PK_8ca197c8a1e588e320014d0d9e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD CONSTRAINT "FK_80b724cb8111d8a5d1b775da7f" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP CONSTRAINT "FK_80b724cb8111d8a5d1b775da7f"`);
        await queryRunner.query(`DROP TABLE "delivery_slip"`);
    }
}
