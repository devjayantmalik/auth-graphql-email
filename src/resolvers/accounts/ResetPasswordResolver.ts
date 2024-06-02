import { Arg, Mutation, Resolver } from "type-graphql";
import { EmailQueue } from "../../db/entities/EmailQueue";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { ResetPasswordInput } from "./dto/ResetPasswordInput";

@Resolver()
export class ResetPasswordResolver {
  @Mutation(() => Boolean, {
    name: "reset_password",
    description: "Sends a reset password email with verification code.",
  })
  async reset_password(
    @Arg("data", () => ResetPasswordInput) data: ResetPasswordInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // generate password reset code
    const code = await redisClient.createResetPasswordCode(exists.email);
    await EmailQueue.schedulePasswordResetEmail(exists, code);

    return true;
  }
}
