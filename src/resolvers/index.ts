import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
];
