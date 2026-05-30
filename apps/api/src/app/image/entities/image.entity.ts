import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Image {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    originalName: string;

    @Column()
    originalUrl: string;

    @Column()
    thumbnailName: string;

    @Column()
    thumbnailUrl: string;

    @Column({ nullable: true })
    mimeType: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}