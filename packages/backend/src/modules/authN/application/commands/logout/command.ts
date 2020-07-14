import { Command } from "@dddl/core/dist/cqrs"

export class LogoutCommand extends Command {
  constructor(public userId: string, public token: string) {
    super()
  }
}
