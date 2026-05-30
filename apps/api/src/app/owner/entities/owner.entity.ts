import { Entity, Unique, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm";
import { Token } from "../../token/entities/token.entity";
import { UserRole } from "@youssef-brand/shared/shared-enums";

@Entity()
@Unique(['email'])
@Index('UQ_ONE_OWNER', ['userRole'], {unique: true, where: "user_role = 'OWNER'"})
export class Owner extends BaseEntity  {

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
    default: UserRole.enum.OWNER,
  })
  userRole: UserRole;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
  updatedAt: Date;

  @OneToMany(() => Token, (token) => token.owner, {
    cascade: true,
    eager: true,
  })
  tokens: Token[]
}
