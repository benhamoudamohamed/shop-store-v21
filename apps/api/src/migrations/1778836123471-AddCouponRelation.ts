import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCouponRelation1778836123471 implements MigrationInterface {
    name = 'AddCouponRelation1778836123471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase" ADD "couponId" integer`);
        await queryRunner.query(`ALTER TABLE "coupon" ALTER COLUMN "userLimit" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "purchase" ADD CONSTRAINT "FK_17fcb3452f906f53adf8b86bde9" FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase" DROP CONSTRAINT "FK_17fcb3452f906f53adf8b86bde9"`);
        await queryRunner.query(`ALTER TABLE "coupon" ALTER COLUMN "userLimit" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "purchase" DROP COLUMN "couponId"`);
    }

}
