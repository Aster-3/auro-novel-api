import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Novel } from "./Novel.js";
import { User } from "./User.js";

@Entity()
export class Author {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 150 })
  name!: string; // Yazarın görünen adı

  @Column({ type: "text", nullable: true })
  bio?: string;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @OneToOne(() => User, (user) => user.authorProfile, { nullable: true })
  @JoinColumn({ name: "userId" })
  user?: string;

  @OneToMany(() => Novel, (novel) => novel.author)
  novels!: Novel[];
}
