import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSnapshotDeliverySlip1779809479369 implements MigrationInterface {
    name = 'AddSnapshotDeliverySlip1779809479369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP CONSTRAINT "FK_80b724cb8111d8a5d1b775da7f"`);
        await queryRunner.query(`CREATE TABLE "invoice" ("id" SERIAL NOT NULL, "invoiceNumber" character varying NOT NULL, "subtotalHT" numeric(10,2) NOT NULL, "totalTax" numeric(10,2) NOT NULL, "discount" numeric(10,2) NOT NULL, "grandTotal" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "purchaseId" integer, CONSTRAINT "UQ_d7bed97fb47876e03fd7d7c285a" UNIQUE ("invoiceNumber"), CONSTRAINT "REL_a1026b84afd1042903897637f1" UNIQUE ("purchaseId"), CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD "subtotalHT" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD "totalTax" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD "discount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD "grandTotal" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoice" ADD CONSTRAINT "FK_a1026b84afd1042903897637f1d" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD CONSTRAINT "FK_309325bfa21e0bccd14590eb79b" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP CONSTRAINT "FK_309325bfa21e0bccd14590eb79b"`);
        await queryRunner.query(`ALTER TABLE "invoice" DROP CONSTRAINT "FK_a1026b84afd1042903897637f1d"`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP COLUMN "grandTotal"`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP COLUMN "totalTax"`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" DROP COLUMN "subtotalHT"`);
        await queryRunner.query(`DROP TABLE "invoice"`);
        await queryRunner.query(`ALTER TABLE "delivery_slip" ADD CONSTRAINT "FK_80b724cb8111d8a5d1b775da7f" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
