import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User.js";
import {
  NotificationTargetType,
  PersonalNotificationType,
} from "../constants/notification.constants.js";

@Entity()
export class PersonalNotification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", select: false })
  userId!: string;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uuid", nullable: true })
  actorUserId?: string | null;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "actorUserId" })
  actorUser?: User | null;

  @Column({ type: "enum", enum: PersonalNotificationType })
  type!: PersonalNotificationType;

  @Column({ type: "enum", enum: NotificationTargetType })
  targetType!: NotificationTargetType;

  @Column({ type: "varchar", length: 255, nullable: true })
  targetId?: string | null;

  @Column({ type: "text", nullable: true })
  targetUrl?: string | null;

  @Index()
  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  aggregationKey?: string | null;

  @Column({ type: "int", default: 1 })
  actorCount!: number;

  @Column({
    type: "jsonb",
    nullable: true,
    transformer: {
      to: (value: any) => value,
      from: (value: any) => {
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
        return value;
      },
    },
  })
  data?: any;

  @Column({ type: "varchar", length: 255, nullable: true })
  titleSnapshot?: string | null;

  @Column({ type: "boolean", default: false })
  isRead!: boolean;

  @Column({ type: "timestamp", nullable: true })
  readAt?: Date | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  lastActivityAt!: Date;

  @Column({ type: "timestamp", nullable: true, select: false })
  lastPushedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
