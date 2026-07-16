import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./_index.js";

@Entity()
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: "varchar", length: 255 })
  codeHash!: string;

  @Column({ type: "timestamp" })
  expiry!: Date;

  @Column({ type: "timestamp", nullable: true })
  lastSentAt?: Date | null;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "uuid" })
  userId!: string;

  @OneToOne(() => User, (user) => user.passwordReset, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}
