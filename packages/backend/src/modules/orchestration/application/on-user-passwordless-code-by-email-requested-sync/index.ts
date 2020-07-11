import { CQ_BUS_DI_TOKEN, CQBus } from "@dddl/core/dist/cqrs"
import { LOGGER_DI_TOKEN, Logger } from "@dddl/core/dist/logger"
import { Inject } from "typedi"
import { UserPasswordlessCodeByEmailRequested } from "../../../authN/application/events"
import { AsyncEventHandler, EventRequest } from "@dddl/core/dist/eda"
import { EitherResultP } from "@dddl/core/dist/rop"
import { SendPasswordlessLoginCodeCommand } from "../../../notifications/application/command/send-passwordless-login-code/command"

export class OnUserPasswordlessCodeByEmailRequestedSync extends AsyncEventHandler<
  UserPasswordlessCodeByEmailRequested,
  undefined
> {
  constructor(
    @Inject(CQ_BUS_DI_TOKEN) private cqBus: CQBus,
    @Inject(LOGGER_DI_TOKEN) private logger: Logger,
  ) {
    super()
  }

  async handle(req: EventRequest<UserPasswordlessCodeByEmailRequested>): EitherResultP {
    const res = await this.cqBus.handle<undefined>(
      new SendPasswordlessLoginCodeCommand(
        req.data.userId,
        req.data.token,
        req.data.email,
      ),
      this.metaFromRequest(req),
    )
    if (res.isError()) {
      this.logger.error(res.error)
    }
    return res
  }
}
