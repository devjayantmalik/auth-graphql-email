import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import argon2 from "argon2";

@Entity({ name: "user_accounts" })
export class UserAccount {
  @PrimaryGeneratedColumn("identity", { name: "id" })
  id: number;

  @Column({ name: "full_name", length: 50 })
  full_name: string;

  @Column({ name: "email", length: 50 })
  email: string;

  @Column({ type: "text" })
  password: string;

  @Column({ type: "timestamptz", nullable: true, default: null })
  account_activated_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }
}
