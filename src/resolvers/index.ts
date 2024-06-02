import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";
import { AuthenticateResolver } from "./accounts/AuthenticateResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ResetPasswordResolver } from "./accounts/ResetPasswordResolver";
import { UpdatePasswordResolver } from "./accounts/UpdatePasswordResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
  AuthenticateResolver,
  ResetPasswordResolver,
  UpdatePasswordResolver,
];
