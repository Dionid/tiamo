import { CQBus } from "@dddl/core/dist/cqrs"
import { DSEventMeta, EventRequest } from "@dddl/core/dist/eda"
import { Matcher, mock, MockProxy } from "jest-mock-extended"
import { Result } from "@dddl/core/dist/rop"
import { UseCaseReqMeta } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { OnUserRegisteredAsync } from "./index"
import { UserRegistered } from "../../../authN/application/events"
import { UserId } from "../../../authN/domain/aggregates/user/user.id"
import { SendRegisterApprovalEmailCommand } from "../../../notifications/application/command/send-register-approval-email/command"
import { Logger } from "@dddl/core/dist/logger"

describe("OnUserRegistered", function () {
  describe("async", function () {
    let cqBus: MockProxy<CQBus>
    let logger: MockProxy<Logger>
    let uc: OnUserRegisteredAsync
    let event: UserRegistered
    let meta: DSEventMeta
    let userId: string
    let req: EventRequest<UserRegistered>

    beforeEach(async () => {
      cqBus = mock<CQBus>()
      logger = mock<Logger>()
      uc = new OnUserRegisteredAsync(cqBus, logger)
      userId = v4()
      event = new UserRegistered(new UserId(userId), "test@mail.com")
      const metaOrF = await DSEventMeta.create({ callerId: v4(), transactionId: v4() })
      if (metaOrF.isError()) {
        throw new Error(metaOrF.error + "")
      }
      meta = metaOrF.value
      req = new EventRequest<UserRegistered>(event, meta)
    })

    it("should send command to CQ bus", async () => {
      cqBus.handle
        .calledWith(
          new Matcher((command) => {
            return (
              command instanceof SendRegisterApprovalEmailCommand &&
              command.userId === event.userId
            )
          }),
          new Matcher((meta: UseCaseReqMeta) => {
            return (
              meta.callerId === meta.callerId && meta.transactionId === meta.transactionId
            )
          }),
        )
        .mockResolvedValue(Result.okup())
      const res = await uc.handle(req)
      if (res.isError()) {
        throw new Error(`Error failed with: ${res.error}`)
      }
      expect(cqBus.handle.mock.calls.length).toEqual(1)
    })
  })
})
