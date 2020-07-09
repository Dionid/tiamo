import { UserId } from "../../../../auth/domain/aggregates/user/user.id"
import { IsUUID } from "class-validator"
import { Command } from "@dddl/cqrs"

export class SendRegisterApprovalEmailCommand extends Command {
  @IsUUID()
  public readonly userId: UserId
  constructor(userId: UserId) {
    super()
    this.userId = userId
  }
}
