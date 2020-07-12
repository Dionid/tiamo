import { AsyncEventHandler, EventRequest, SyncEventHandler } from "@dddl/core/dist/eda"
import { Inject } from "typedi"
import { CQ_BUS_DI_TOKEN, CQBus } from "@dddl/core/dist/cqrs"
import { EitherResultP } from "@dddl/core/dist/rop"
import { UserRegistered } from "../../../authN/application/events"
import { SendRegisterApprovalEmailCommand } from "../../../notifications/application/command/send-register-approval-email/command"
import { LOGGER_DI_TOKEN, Logger } from "@dddl/core/dist/logger"

export class OnUserRegisteredAsync extends AsyncEventHandler<UserRegistered, undefined> {
  constructor(
    @Inject(CQ_BUS_DI_TOKEN) private cqBus: CQBus,
    @Inject(LOGGER_DI_TOKEN) private logger: Logger,
  ) {
    super()
  }

  async handle(req: EventRequest<UserRegistered>): EitherResultP {
    const res = await this.cqBus.handle<undefined>(
      new SendRegisterApprovalEmailCommand(req.data.userId, req.data.email),
      this.metaFromRequest(req),
    )
    if (res.isError()) {
      this.logger.error(res.error)
    }
    return res
  }
}
