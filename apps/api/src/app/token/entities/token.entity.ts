import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Owner } from "../../owner/entities/owner.entity";
import { Admin } from "../../admin/entities/admin.entity";
import { Moderator } from "../../moderator/entities/moderator.entity";
import { UserRole } from "@youssef-brand/shared/shared-enums";

@Entity()
export class Token extends BaseEntity  {

  @PrimaryGeneratedColumn('increment')
  id: string;
 
  @Column({ nullable: true })
  ownerId: string;

  @Column({ nullable: true })
  adminId: string;

  @Column({ nullable: true })
  moderatorId: string;

  @Column({nullable: true, select: false})
  accessToken: string;

  @Column({nullable: true, select: false})
  accessKey: string;

  @Column({default: true})
  isRevoked: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;

  @Column({
    name: 'user_role',
    type: 'enum',
    enum: UserRole.options,
    enumName: 'user_role_enum'
  })
  userRole: UserRole;

  @ManyToOne(() => Owner, (owner) => owner.tokens, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true
  })
  @JoinColumn({ name: 'ownerId' })
  owner: Owner;

  @ManyToOne(() => Admin, (admin) => admin.tokens, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    nullable: true
  })
  @JoinColumn({ name: 'adminId' })
  admin: Admin;

  @ManyToOne('Moderator', 'tokens', {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true
  })
  @JoinColumn({ name: 'moderatorId' })
  moderator: Moderator;
}
