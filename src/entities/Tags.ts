import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
export class Tags {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 30 })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.tags)
  createdBy!: User;

  @ManyToMany(() => Novel, (novel) => novel.tags, {
    nullable: false,
    onDelete: "CASCADE",
  })
  novel!: Novel[];
}
