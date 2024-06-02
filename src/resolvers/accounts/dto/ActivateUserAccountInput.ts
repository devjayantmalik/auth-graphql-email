import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class ActivateUserAccountInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(4, 10, { message: "Invalid activation code" })
  @Field(() => String, { name: "activation_code" })
  activation_code: string;
}
