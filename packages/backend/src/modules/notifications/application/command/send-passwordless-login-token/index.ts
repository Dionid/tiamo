import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { Inject } from "typedi"
import {
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../../authN/domain/repositories"
import {
  NOTIFICATION_SENDER_DI_TOKEN,
  NotificationSender,
} from "../../notificationservice"
import { SendPasswordlessLoginTokenCommand } from "./command"

export class SendPasswordlessLoginToken
  implements CommandHandler<SendPasswordlessLoginTokenCommand> {
  constructor(
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
    @Inject(NOTIFICATION_SENDER_DI_TOKEN) private notificationSender: NotificationSender,
  ) {}

  async handle(req: CommandRequest<SendPasswordlessLoginTokenCommand>): EitherResultP {
    return this.notificationSender.sendPasswordlessAuthToken(
      req.data.email,
      req.data.token,
    )
  }
}
