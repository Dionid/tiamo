import { Command } from "@dddl/core/dist/cqrs"

export class ApproveEmailByTokenCommand extends Command {
  constructor(public email: string, public token: string) {
    super()
  }
}
