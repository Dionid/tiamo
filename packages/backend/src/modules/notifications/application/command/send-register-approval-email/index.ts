import {CommandHandler, CommandRequest} from "@dddl/cqrs"
import {RegisterUserPasswordlessCommand} from "../../../../auth/application/commands/register-user-passwordless/command"
import {Inject} from "typedi"
import {USER_REPOSITORY_DI_TOKEN, UserRepository} from "../../../../auth/domain/repositories"
import {EitherResultP, Result} from "@dddl/rop"

export class SendRegisterApprovalEmail
  implements CommandHandler<RegisterUserPasswordlessCommand> {
  constructor(
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  async handle(req: CommandRequest<RegisterUserPasswordlessCommand>): EitherResultP {
    return Result.oku()
  }
}
