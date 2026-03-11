import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";

@Entity()
export class Category {
  @PrimaryGeneratedColumn("increment")
  id!: number;

  @Index()
  @Column({ type: "varchar", unique: true, length: 30 })
  enName!: string;

  @Index()
  @Column({ type: "varchar", unique: true, length: 30 })
  trName!: string;

  @Column({ type: "text", nullable: true })
  coverUrl?: string;

  @ManyToMany(() => Novel, (novel) => novel.categories, {
    onDelete: "CASCADE",
  })
  novels!: Novel[];
}
