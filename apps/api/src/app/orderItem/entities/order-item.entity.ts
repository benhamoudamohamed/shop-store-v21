import { Entity, BaseEntity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Product } from "../../product/entities/product.entity";
import { Purchase } from "../../purchase/entities/purchase.entity";

export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data);
  }
}

@Entity()
export class OrderItem extends BaseEntity {
  
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
    unitpriceAtPurchase: number; 

    @Column({ type: 'decimal', precision: 5, scale: 2, transformer: new ColumnNumericTransformer(), comment: 'The % rate at purchase' })
    tvaRate: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer(), comment: 'Total tax amount for this line' })
    tvaAmount: number; // Snapshot of the calculated money (Qty * UnitPrice * Rate)

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
    totalHT: number; // (quantity * unitpriceAtPurchase)

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: new ColumnNumericTransformer() })
    totalTTC: number; // (totalHT + tvaAmount)

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;

    @ManyToOne(() => Purchase, (purchase) => purchase.orderItems, {
        onDelete: "CASCADE",
    })
    purchase: Purchase;

    @ManyToOne(() => Product, (product) => product.orderItems, {
        onDelete: "SET NULL",
    })
    product: Product;
}