import { Field, ID, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserAccountRole {
  Admin = "admin",
  Client = "client",
}

@ObjectType()
@Entity({ name: "user_accounts" })
export class UserAccount extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Field(() => String, { name: "full_name" })
  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Field(() => String, { name: "email" })
  @Column({ name: "email", length: 50, unique: true })
  email: string;

  @Column({ name: "password", type: "text" })
  password: string;

  @Column({
    name: "role",
    type: "enum",
    enum: UserAccountRole,
    enumName: "user_account_role",
    default: UserAccountRole.Client,
  })
  role: UserAccountRole;

  @Column({ name: "account_activated_at", type: "timestamp", nullable: true, default: null })
  account_activated_at?: Date;

  @Field(() => String, { name: "auth_token" })
  @Column({ name: "auth_token", length: 10, default: "" })
  auth_token: string;

  @Column({ name: "auth_token_expires_at", type: "timestamp", default: "now()" })
  auth_token_expires_at: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
