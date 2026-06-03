import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactoringCoupon1780483155699 implements MigrationInterface {
    name = 'RefactoringCoupon1780483155699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupon" RENAME COLUMN "userLimit" TO "maxUses"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coupon" RENAME COLUMN "maxUses" TO "userLimit"`);
    }

}
