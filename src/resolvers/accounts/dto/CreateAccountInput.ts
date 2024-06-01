import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateAccountInput {
  @Length(1, 30, { message: "Fullname is required and must contain atmost 30 characters." })
  @Field(() => String, { name: "full_name" })
  full_name: string;

  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 30, { message: "Password must contain atleast 6 and atmost 30 characters" })
  @Field(() => String, { name: "password" })
  password: string;
}
