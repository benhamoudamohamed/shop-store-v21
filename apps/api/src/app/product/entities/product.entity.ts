import { Entity, Unique, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne, UpdateDateColumn, OneToMany } from "typeorm";
import { Category } from '../../category/entities/category.entity';
import { Image } from '../../image/entities/image.entity';
import { OrderItem } from "../../orderItem/entities/order-item.entity";

@Entity()
@Unique(['name'])
@Unique(['productCode'])
export class Product extends BaseEntity {
    
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    productCode: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unitPrice: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    tvaRate: number;

    get totalTTC(): number {
        const price = Number(this.unitPrice);
        const rate = Number(this.tvaRate);
        const taxAmount = (price * rate) / 100;
        return Number((price + taxAmount).toFixed(2));
    }

    @Column({ type: 'int', default: 0 })
    stock: number;
    
    @Column({
        type: 'boolean',
        default: false,
    })
    isFavorite: boolean;

    @Column({
        type: 'boolean', 
        default: false,
    })
    isAvailable: boolean;

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

    @ManyToOne(() => Category, category => category.products, {
        onDelete: "CASCADE",
    })
    category: Category;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.product, { cascade: true })
    orderItems: OrderItem[];
}
