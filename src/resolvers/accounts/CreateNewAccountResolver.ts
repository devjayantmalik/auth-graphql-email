import { Arg, Mutation, Resolver } from "type-graphql";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { CreateAccountInput } from "./dto/CreateAccountInput";
import argon2 from "argon2";
import { EmailQueue } from "../../db/entities/EmailQueue";

@Resolver()
export class CreateNewAccountResolver {
  @Mutation(() => Boolean, {
    name: "create_account",
    description: "Creates new account and sends activation email to provided email address.",
  })
  async create_account(
    @Arg("data", () => CreateAccountInput) data: CreateAccountInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.count({ where: { email: data.email } });
    if (!!exists) return true;

    // create new account with provided details
    const account = await UserAccount.save({
      full_name: data.full_name,
      email: data.email,
      password: await argon2.hash(data.password),
    });

    // generate activation code and schedule email
    const code = await redisClient.createActivationCode(account.email);
    await EmailQueue.scheduleActivateUserAccountEmail(account, code);

    return true;
  }
}
