import type { YogaInitialContext } from "graphql-yoga";
import type { AuthChecker } from "type-graphql";
import { UserAccount, type UserAccountRole } from "../db/entities/UserAccount";

export const authChecker: AuthChecker<YogaInitialContext, UserAccountRole> = async (
  { context },
  roles,
) => {
  const auth_token = context.request.headers.get("authorization");
  if (!auth_token) return false;

  // validate auth token
  const account = await UserAccount.findOne({ where: { auth_token: auth_token } });
  if (!account) return false;

  // check user role incase role is specified
  if (!!roles.length && !roles.includes(account.role)) return false;

  return true;
};
