import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UpdatePasswordInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 10, { message: "Invalid verification code" })
  @Field(() => String, { name: "verification_code" })
  verification_code: string;

  @Length(6, 30, { message: "Password must contain atleast 6 and atmost 30 characters" })
  @Field(() => String, {
    name: "password",
    description: "Updated password to set on user account.",
  })
  password: string;
}
