import { UserRole } from '@youssef-brand/shared/shared-enums';
import { Token } from '@youssef-brand/shared/shared-types';
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity()
@Unique(['email'])
export class Moderator extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @Column()
  fullName: string; 

  @Column()
  email: string;

  @Column({select: false})
  password: string;

  @Column({
    name: 'user_role',
    type: 'enum',
    enum: UserRole.options,
    enumName: 'user_role_enum',
    default: UserRole.enum.MODERATOR,
  })
  userRole: UserRole;

  @Column({default: false})
  isActivated: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({type: 'text', nullable: true, select: false}) 
  verificationCode: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;

  @OneToMany('Token', 'moderator', { 
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  tokens: Token[];
}
