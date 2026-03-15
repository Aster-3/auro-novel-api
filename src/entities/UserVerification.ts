import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./_index.js";

@Entity()
export class UserVerification {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column({ type: "varchar", length: 6 })
  code!: string;

  @Column({ type: "timestamp" })
  expiry!: Date;

  @Column({ type: "int", default: 0 })
  attempts!: number;

  @Column({ type: "uuid" })
  userId!: string;

  @OneToOne(() => User, (user) => user.verification, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}
