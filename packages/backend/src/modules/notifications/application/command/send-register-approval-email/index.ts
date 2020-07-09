import { CommandHandler, CommandRequest } from "@dddl/cqrs"
import { Inject } from "typedi"
import {
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../../auth/domain/repositories"
import { EitherResultP, Result } from "@dddl/rop"
import {
  NOTIFICATION_SENDER_DI_TOKEN,
  NotificationSender,
} from "../../notificationservice"
import { CriticalErr } from "@dddl/errors"
import { GetUserByActivatingEmailAndUserId } from "../../repositories"
import { SendRegisterApprovalEmailCommand } from "./command"

export class SendRegisterApprovalEmail
  implements CommandHandler<SendRegisterApprovalEmailCommand> {
  constructor(
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
    @Inject(NOTIFICATION_SENDER_DI_TOKEN) private notificationSender: NotificationSender,
  ) {}

  async handle(req: CommandRequest<SendRegisterApprovalEmailCommand>): EitherResultP {
    const specRes = GetUserByActivatingEmailAndUserId.create(
      req.data.userId,
      req.data.email,
    )
    if (specRes.isError()) {
      return Result.error(specRes.error)
    }
    const userRes = await this.userRepo.getBySpecs([specRes.value])
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }
    if (!userRes.value) {
      return Result.error(
        new CriticalErr(
          `User with id: ${req.data.userId} and email: ${req.data.userId} not found`,
        ),
      )
    }

    const inActiveToken = await userRes.value.state.tokenList.getInactiveToken()
    if (inActiveToken.isError()) {
      return Result.error(inActiveToken.error)
    }
    if (!inActiveToken.value) {
      return Result.error(
        new CriticalErr(
          `User with id: ${req.data.userId} and email: ${req.data.userId} doesn't have invalid token`,
        ),
      )
    }

    return this.notificationSender.sendRegistrationApprovalMail(
      req.data.email,
      inActiveToken.value.props.value,
    )
  }
}
