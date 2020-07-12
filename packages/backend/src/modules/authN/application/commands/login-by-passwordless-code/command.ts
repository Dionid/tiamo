import { Command, Hybrid } from "@dddl/core/dist/cqrs"
import { IsEmail } from "class-validator"

export class LoginByPasswordlessCodeCommandResponse {
  constructor(public token: string) {}
}

export class LoginByPasswordlessCodeCommand extends Hybrid<
  LoginByPasswordlessCodeCommandResponse
> {
  @IsEmail()
  email: string

  constructor(public code: string, email: string) {
    super()
    this.email = email
  }
}
