import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCreateProductApi1781878569221 implements MigrationInterface {
    name = 'UpdateCreateProductApi1781878569221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_b1b332c0f436897f21a960f26c7"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "REL_b1b332c0f436897f21a960f26c"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "imageId"`);
        await queryRunner.query(`ALTER TABLE "image" ADD "productId" integer`);
        await queryRunner.query(`ALTER TABLE "image" ADD CONSTRAINT "FK_c6eb61588205e25a848ba6105cd" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "image" DROP CONSTRAINT "FK_c6eb61588205e25a848ba6105cd"`);
        await queryRunner.query(`ALTER TABLE "image" DROP COLUMN "productId"`);
        await queryRunner.query(`ALTER TABLE "product" ADD "imageId" integer`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "REL_b1b332c0f436897f21a960f26c" UNIQUE ("imageId")`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_b1b332c0f436897f21a960f26c7" FOREIGN KEY ("imageId") REFERENCES "image"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

}
