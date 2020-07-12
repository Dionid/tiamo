import {
  GetUserByApprovingEmailAndToken,
  UserRepository,
} from "../../../domain/repositories"
import { Matcher, mock, MockProxy } from "jest-mock-extended"
import { UseCaseReqMeta, UseCaseRequest } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { Result } from "@dddl/core/dist/rop"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { Specification } from "@dddl/core/dist/dal"
import { TokenList } from "../../../domain/aggregates/user/token.vo"
import { UserId } from "../../../domain/aggregates/user/user.id"
import { ApproveEmailByToken } from "./index"
import { DSEvent, EventBus } from "@dddl/core/dist/eda"
import { ApproveEmailByTokenCommand } from "./command"
import { UserApprovedEmailByToken } from "../../events"
import { Email, EmailStatus } from "../../../domain/aggregates/user/email.vo"

describe("Register User paswordless", function () {
  let userRepo: MockProxy<UserRepository>
  let eventBus: MockProxy<EventBus>
  let uc: ApproveEmailByToken
  const getUserByApprovingEmailAndTokenMatcher = (reqEmail: string, token: string) =>
    new Matcher((specs: Specification<User>[] | undefined) => {
      if (!specs) return false
      const spec = specs[0]
      return (
        specs &&
        spec instanceof GetUserByApprovingEmailAndToken &&
        spec.email === reqEmail &&
        spec.token === token
      )
    })

  beforeEach(async () => {
    eventBus = mock<EventBus>()
    userRepo = mock<UserRepository>()
    uc = new ApproveEmailByToken(eventBus, userRepo)
  })

  describe("if no User has been taken this active email", function () {
    it("should call eventbus with UserRegistered and UserCreated events and return undefined", async function () {
      const reqEmail = "test@mail.ru"
      const callerId = v4()
      const token = v4()
      const req = new UseCaseRequest(
        new ApproveEmailByTokenCommand(reqEmail, token),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      const tokenListRes = await TokenList.create([])
      if (tokenListRes.isError()) {
        throw tokenListRes.error
      }
      const emailRes = await Email.create({
        value: reqEmail,
        status: EmailStatus.activating,
        approved: false,
        token: token,
      })
      if (emailRes.isError()) {
        throw emailRes.error
      }
      const user = await User.__createByRepository(new UserId(v4()), {
        tokenList: tokenListRes.value,
        emailList: [emailRes.value],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastSeenAt: new Date(),
      })
      userRepo.getBySpecs
        .calledWith(getUserByApprovingEmailAndTokenMatcher(reqEmail, token))
        .mockResolvedValue(Result.ok(user))
      eventBus.publish
        .calledWith(
          new Matcher((events: DSEvent[]) => {
            return events.some(
              (event) =>
                event instanceof UserApprovedEmailByToken &&
                event.userId === user.id &&
                event.email === reqEmail,
            )
          }),
        )
        .mockResolvedValue(Result.oku())
      userRepo.save
        .calledWith(
          new Matcher((u: User) => {
            return u.id.toValue() === user.id.toValue()
          }),
        )
        .mockResolvedValue(Result.oku())
      const res = await uc.handle(req)
      if (res.isError()) {
        throw res.error
      }
      expect(res.value).toBeUndefined()
      expect(userRepo.getBySpecs.mock.calls.length).toEqual(1)
      expect(userRepo.save.mock.calls.length).toEqual(1)
      expect(eventBus.publish.mock.calls.length).toEqual(1)
    })
  })
})
