import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { Product } from "../../product/entities/product.entity";

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

    @ManyToOne(() => Product, (product) => product.images, { onDelete: 'CASCADE' })
    product: Product;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}