import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Purchase } from '../../purchase/entities/purchase.entity';

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn('increment')
    id: string;

    @Column({ unique: true })
    invoiceNumber: string; // e.g., "INV-2026-00001"

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    // 🪙 Financial snapshots to preserve historical integrity
    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
        to: (value: number) => value,
        from: (value: string) => Number(value)
    }})
    subtotalHT: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
        to: (value: number) => value,
        from: (value: string) => Number(value)
    }})
    totalTax: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
        to: (value: number) => value,
        from: (value: string) => Number(value)
    }})
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: {
        to: (value: number) => value,
        from: (value: string) => Number(value)
    }})
    grandTotal: number;

    // 🔗 1:1 Link with the Purchase
    @OneToOne(() => Purchase, (purchase) => purchase.invoice, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchaseId' })
    purchase: Purchase;
}