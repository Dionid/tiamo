import { AsyncEventHandler, EventRequest, SyncEventHandler } from "@dddl/eda"
import { Inject } from "typedi"
import { CQ_BUS_DI_TOKEN, CQBus } from "@dddl/cqrs"
import { EitherResultP } from "@dddl/rop"
import { UserRegistered } from "../../../auth/application/events"
import { SendRegisterApprovalEmailCommand } from "../../../notifications/application/command/send-register-approval-email/command"

export class OnUserRegistered extends AsyncEventHandler<UserRegistered, undefined> {
  constructor(@Inject(CQ_BUS_DI_TOKEN) private cqBus: CQBus) {
    super()
  }

  async handle(req: EventRequest<UserRegistered>): EitherResultP {
    const res = await this.cqBus.handle<undefined>(
      new SendRegisterApprovalEmailCommand(req.data.userId),
      this.metaFromRequest(req),
    )
    if (res.isError()) {
      console.warn(`Error in OnWidgetQuestionCreatedAsync: ${res.error}`)
    }
    return res
  }
}
