import { Command } from "@dddl/core/dist/cqrs"

export class RequestPasswordlessCodeByEmailCommand extends Command {
  constructor(public email: string) {
    super()
  }
}
