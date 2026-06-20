import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm";
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

    @ManyToMany(() => Product, (product) => product.images)
    products: Product[];

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}