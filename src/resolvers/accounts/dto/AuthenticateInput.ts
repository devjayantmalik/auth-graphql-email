import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class AuthenticateInput {
  @IsEmail({}, { message: "Invalid email provided." })
  @Field(() => String, { name: "email" })
  email: string;

  @Length(6, 30, { message: "Invalid password provided." })
  @Field(() => String, { name: "password" })
  password: string;
}
