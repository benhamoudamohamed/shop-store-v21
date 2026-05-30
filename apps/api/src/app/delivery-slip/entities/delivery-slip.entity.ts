import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Purchase } from '../../purchase/entities/purchase.entity';

@Entity()
export class DeliverySlip {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column({ unique: true })
  slipNumber: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  createdAt: Date;
  
  // Financial snapshots to preserve shipment record integrity
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

  @OneToOne(() => Purchase, (purchase) => purchase.deliverySlip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;
}
