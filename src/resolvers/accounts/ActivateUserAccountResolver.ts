import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";
import { redisClient } from "../../db/redis";
import { ActivateUserAccountInput } from "./dto/ActivateUserAccountInput";

@Resolver()
export class ActivateUserAccountResolver {
  @Mutation(() => Boolean, {
    name: "activate_account",
    description: "Activates user account with provided verification code.",
  })
  async activate_account(
    @Arg("data", () => ActivateUserAccountInput) data: ActivateUserAccountInput,
  ): Promise<Boolean> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) return true;

    // skip for invalid activation code
    if (!(await redisClient.isActivationCodeValid(exists.email, data.activation_code))) {
      return true;
    }

    // activate user account
    await UserAccount.update({ id: exists.id }, { account_activated_at: new DateTime() });
    return true;
  }
}
