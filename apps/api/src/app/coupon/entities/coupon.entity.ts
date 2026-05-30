import { Entity, Unique, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
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
@Unique(['code'])
export class Coupon extends BaseEntity {
    
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column()
  code: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, transformer: new ColumnNumericTransformer() })
  discountPercentage: number; // e.g., 10.00 for 10%

  @Column({ default: 0 })
  usedCount: number;

  @Column({ type: 'int', default: 0 })
  userLimit: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp' })
  expirationDate: Date;

  @Column({ default: true })
  isActive: boolean; 

  @Column({ default: false })
  isExpired: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;

  // Helper method to check if coupon is valid right now
  get isValid(): boolean {
    const now = new Date();
    return (
      this.isActive &&
      !this.isExpired &&
      this.usedCount < this.userLimit &&
      now >= (this.startDate || this.createdAt) &&
      now <= this.expirationDate
    );
  }

  @OneToMany(() => Purchase, (purchase) => purchase.coupon)
  purchases: Purchase[]; 
}