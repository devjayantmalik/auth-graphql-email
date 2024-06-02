import type { NonEmptyArray } from "type-graphql";
import { HealthResolver } from "./HealthResolver";
import { CreateNewAccountResolver } from "./accounts/CreateNewAccountResolver";
import { ActivateUserAccountResolver } from "./accounts/ActivateUserAccountResolver";

export const AllResolvers: NonEmptyArray<Function> = [
  HealthResolver,
  CreateNewAccountResolver,
  ActivateUserAccountResolver,
];
