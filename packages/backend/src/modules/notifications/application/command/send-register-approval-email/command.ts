import { UserId } from "../../../../auth/domain/aggregates/user/user.id"
import { IsEmail, IsNotEmpty, IsUUID } from "class-validator"
import { Command } from "@dddl/cqrs"

export class SendRegisterApprovalEmailCommand extends Command {
  @IsNotEmpty()
  public readonly userId: UserId
  @IsEmail()
  public readonly email: string
  constructor(userId: UserId, email: string) {
    super()
    this.userId = userId
    this.email = email
  }
}
