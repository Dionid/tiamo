import { Command } from "@dddl/core/dist/cqrs"

export class LoginPasswordlessByEmailCommand extends Command {
  constructor(public email: string) {
    super()
  }
}
