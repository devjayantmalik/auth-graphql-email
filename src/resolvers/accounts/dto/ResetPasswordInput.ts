import { IsEmail } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class ResetPasswordInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;
}
