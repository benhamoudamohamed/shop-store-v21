import { Entity, Unique, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from "typeorm";
import { Image } from '../../image/entities/image.entity';
import { Product } from "../../product/entities/product.entity";

@Entity()
@Unique(['name'])
export class Category extends BaseEntity {
    
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;

    @OneToOne(() => Image, {
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        nullable: true,
        cascade: true
    })
    @JoinColumn()
    image: Image;

  @OneToMany(() => Product, product => product.category, {cascade: true})
  products: Product[];
}