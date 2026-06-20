import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatingImageRelationDB1781966992434 implements MigrationInterface {
    name = 'UpdatingImageRelationDB1781966992434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "image" DROP CONSTRAINT "FK_c6eb61588205e25a848ba6105cd"`);
        await queryRunner.query(`CREATE TABLE "product_images" ("productId" integer NOT NULL, "imageId" integer NOT NULL, CONSTRAINT "PK_52e019b6e8e32b79a69c92ae9ca" PRIMARY KEY ("productId", "imageId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b367708bf720c8dd62fc683316" ON "product_images" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9eb7d7ebaf2263ae0e45fea918" ON "product_images" ("imageId") `);
        await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "productId"`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_b367708bf720c8dd62fc6833161" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_images" ADD CONSTRAINT "FK_9eb7d7ebaf2263ae0e45fea9184" FOREIGN KEY ("imageId") REFERENCES "image"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_9eb7d7ebaf2263ae0e45fea9184"`);
        await queryRunner.query(`ALTER TABLE "product_images" DROP CONSTRAINT "FK_b367708bf720c8dd62fc6833161"`);
        await queryRunner.query(`ALTER TABLE "image" ADD "productId" integer`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9eb7d7ebaf2263ae0e45fea918"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b367708bf720c8dd62fc683316"`);
        await queryRunner.query(`DROP TABLE "product_images"`);
        await queryRunner.query(`ALTER TABLE "image" ADD CONSTRAINT "FK_c6eb61588205e25a848ba6105cd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
