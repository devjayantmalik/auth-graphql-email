import argon2 from "argon2";
import { Arg, Mutation, Resolver } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { Random } from "../../common/Random";
import { UserAccount } from "../../db/entities/UserAccount";
import { AuthenticateInput } from "./dto/AuthenticateInput";

@Resolver()
export class AuthenticateResolver {
  @Mutation(() => UserAccount, {
    name: "authenticate",
    description: "Checks accounts credentials and returns auth token.",
  })
  async authenticate(
    @Arg("data", () => AuthenticateInput) data: AuthenticateInput,
  ): Promise<UserAccount> {
    // check if user account already exists with provided email
    const exists = await UserAccount.findOne({ where: { email: data.email } });
    if (!exists) throw new Error("Invalid credentials provided.");

    // check password
    if (!(await argon2.verify(exists.password, data.password)))
      throw new Error("Invalid credentials provided.");

    // update auth token
    exists.auth_token = Random.createAuthToken();
    exists.auth_token_expires_at = new DateTime().addHours(2);
    const updated = await exists.save();

    return updated;
  }
}
