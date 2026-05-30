import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1778755958047 implements MigrationInterface {
    name = 'InitialMigration1778755958047'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums if they don't exist
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status_enum') THEN
                CREATE TYPE "public"."purchase_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');
            END IF;
        END $$;`);
        
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
                CREATE TYPE "public"."user_role_enum" AS ENUM('OWNER', 'ADMIN', 'MODERATOR');
            END IF;
        END $$;`);
        
        // Add purchase status column if it doesn't exist
        await queryRunner.query(`DO $$ BEGIN
            IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='purchase' AND column_name='status') THEN
                ALTER TABLE "purchase" ADD COLUMN "status" "public"."purchase_status_enum" NOT NULL DEFAULT 'PENDING';
            END IF;
        END $$;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase" DROP COLUMN IF EXISTS "status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."purchase_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);
    }

}

