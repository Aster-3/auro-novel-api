import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class DeletedAccountRecovery {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "char", length: 64 })
  emailHash!: string;

  @Column({ type: "char", length: 64 })
  usernameHash!: string;

  @Column({ type: "timestamp" })
  deletedAt!: Date;

  @Index()
  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
