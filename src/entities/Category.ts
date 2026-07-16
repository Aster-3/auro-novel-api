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
  title!: string;

  @ManyToMany(() => Novel, (novel) => novel.categories, {
    onDelete: "CASCADE",
  })
  novels!: Novel[];
}
