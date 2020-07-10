import { Command } from "@dddl/cqrs"

export class ApproveTokenCommand extends Command {
  constructor(public email: string, public token: string) {
    super()
  }
}
