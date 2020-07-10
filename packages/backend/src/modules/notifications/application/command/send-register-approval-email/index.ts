import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { Inject } from "typedi"
import {
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../../auth/domain/repositories"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import {
  NOTIFICATION_SENDER_DI_TOKEN,
  NotificationSender,
} from "../../notificationservice"
import { CriticalErr } from "@dddl/core/dist/errors"
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

    const email = userRes.value.state.emailList.find(
      (em) => em.props.value === req.data.email,
    )
    if (!email) {
      return Result.error(
        new CriticalErr(
          `User with id: ${req.data.userId} and email: ${req.data.userId} not found`,
        ),
      )
    }

    return this.notificationSender.sendRegistrationApprovalMail(
      email.props.value,
      email.props.token,
    )
  }
}
