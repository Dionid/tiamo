import { Command } from "@dddl/core/dist/cqrs"
import { UserId } from "../../../domain/aggregates/user/user.id"

export class LogoutCommand extends Command {
  constructor(public userId: UserId, public token: string) {
    super()
  }
}
