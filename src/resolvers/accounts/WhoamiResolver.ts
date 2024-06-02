import type { YogaInitialContext } from "graphql-yoga";
import { Ctx, Query, Resolver, Authorized } from "type-graphql";
import { DateTime } from "../../common/DateTime";
import { UserAccount } from "../../db/entities/UserAccount";

@Resolver()
export class WhoamiResolver {
  @Authorized()
  @Query(() => UserAccount, {
    name: "whoami",
    description: "Returns currently authenticated user based on Authorization header.",
    nullable: true,
  })
  async whoami(@Ctx() context: YogaInitialContext): Promise<UserAccount | null> {
    const token = context.request.headers.get("authorization");
    if (!token) return null;

    // check if auth_token is valid
    const account = await UserAccount.findOne({ where: { auth_token: token } });
    if (!account || account.auth_token_expires_at.getTime() <= new DateTime().getTime()) {
      return null;
    }

    // return account otherwise
    return account;
  }
}
