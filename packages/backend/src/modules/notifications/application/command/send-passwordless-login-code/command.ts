import { Command } from "@dddl/core/dist/cqrs"
import { IsUUID, IsNotEmpty, IsEmail } from "class-validator"
import { UserId } from "../../../../authN/domain/aggregates/user/user.id"

export class SendPasswordlessLoginCodeCommand extends Command {
  @IsNotEmpty()
  public readonly userId: UserId
  @IsUUID()
  public readonly token: string
  @IsEmail()
  public readonly email: string
  constructor(userId: UserId, token: string, email: string) {
    super()
    this.userId = userId
    this.token = token
    this.email = email
  }
}
