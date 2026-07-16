import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
export class Tags {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 30, unique: true })
  name!: string;

  @Index()
  @Column({ type: "varchar", length: 50, unique: true })
  slug!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, (user) => user.createdTags, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "createdById" })
  createdBy!: User | null;

  @ManyToMany(() => Novel, (novel) => novel.tags, { onDelete: "CASCADE" })
  novels!: Novel[];
}
