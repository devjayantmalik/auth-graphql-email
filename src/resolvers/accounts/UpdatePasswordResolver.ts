import argon2 from "argon2";
import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { UpdatePasswordInput } from "./dto/UpdatePasswordInput";

@Resolver()
export class UpdatePasswordResolver {
  @Mutation(() => Boolean, {
    name: "update_password",
    description: "Updates password for a user account with email and verification code",
  })
  async update_password(
    @Arg("data", () => UpdatePasswordInput) data: UpdatePasswordInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // check if activation code is valid
    const isValid = await redisClient.isResetPasswordCodeValid(
      exists.email,
      data.verification_code,
    );
    if (!isValid) throw new Error("Invalid activation code provided.");

    // update password for valid activation code
    await UserAccount.update(
      { id: exists.id },
      { password: await argon2.hash(data.password), auth_token_expires_at: new DateTime() },
    );

    return true;
  }
}
