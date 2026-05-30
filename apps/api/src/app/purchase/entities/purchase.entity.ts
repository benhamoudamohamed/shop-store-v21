import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, UpdateDateColumn, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { OrderItem } from "../../orderItem/entities/order-item.entity";
import { PurchaseStatus } from "@youssef-brand/shared/shared-enums";
import { Coupon } from "../../coupon/entities/coupon.entity";
import { Invoice } from "../../invoice/entities/invoice.entity";
import { DeliverySlip } from "../../delivery-slip/entities/delivery-slip.entity";

@Entity()
export class Purchase extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column()
    clientName: string;

    @Column()
    email: string;

    @Column()
    phone: string;

    @Column()
    address: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total HT before tax and discount' })
    subtotal: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Total tax amount (TVA)' })
    totalTax: number;

    @Column({ nullable: true })
    couponCode: string; 

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Final amount paid (TTC)' })
    grandTotal: number;

    @Column({ default: 'TND' })
    currency: string;

    @Column({ type: 'enum', enum: PurchaseStatus.options, default: PurchaseStatus.enum.PENDING })
    status: PurchaseStatus;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;

    @OneToMany(() => OrderItem, (orderItem) => orderItem.purchase, { cascade: true })
    orderItems: OrderItem[];

    @ManyToOne(() => Coupon, (coupon) => coupon.purchases, { nullable: true })
    @JoinColumn({ name: 'couponId' }) // This creates a 'couponId' column in the DB
    coupon: Coupon | null;

    @OneToOne(() => Invoice, (invoice) => invoice.purchase)
    invoice: Invoice;

    @OneToOne(() => DeliverySlip, (deliverySlip) => deliverySlip.purchase)
    deliverySlip: DeliverySlip;
}
