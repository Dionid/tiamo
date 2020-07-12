import { GetUserByActiveEmail, UserRepository } from "../../../domain/repositories"
import { any, Matcher, mock, MockProxy } from "jest-mock-extended"
import { DSEvent, EventBus } from "@dddl/core/dist/eda"
import { UseCaseReqMeta, UseCaseRequest } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { Result } from "@dddl/core/dist/rop"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { UserPasswordlessCodeByEmailRequested, UserRegistered } from "../../events"
import { UserCreated } from "../../../domain/aggregates/user/user.events"
import { Specification } from "@dddl/core/dist/dal"
import { RequestPasswordlessCodeByEmailCommand } from "./command"
import { RequestPasswordlessCodeByEmail } from "./index"
import { Token, TokenList } from "../../../domain/aggregates/user/token.vo"
import { UserId } from "../../../domain/aggregates/user/user.id"

describe("Register User paswordless", function () {
  let userRepo: MockProxy<UserRepository>
  let eventBus: MockProxy<EventBus>
  let uc: RequestPasswordlessCodeByEmail
  const getActiveUserByEmailMatcher = (reqEmail: string) =>
    new Matcher((specs: Specification<User>[] | undefined) => {
      if (!specs) return false
      const spec = specs[0]
      return specs && spec instanceof GetUserByActiveEmail && spec.email === reqEmail
    })

  beforeEach(async () => {
    eventBus = mock<EventBus>()
    userRepo = mock<UserRepository>()
    uc = new RequestPasswordlessCodeByEmail(eventBus, userRepo)
  })

  describe("if no User has been taken this active email", function () {
    it("should call eventbus with UserRegistered and UserCreated events and return undefined", async function () {
      const reqEmail = "test@mail.ru"
      const callerId = v4()
      const req = new UseCaseRequest(
        new RequestPasswordlessCodeByEmailCommand(reqEmail),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      const tokenRes = await TokenList.create([])
      if (tokenRes.isError()) {
        throw tokenRes.error
      }
      const user = await User.__createByRepository(new UserId(v4()), {
        tokenList: tokenRes.value,
        emailList: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        lastSeenAt: new Date(),
      })
      userRepo.getBySpecs
        .calledWith(getActiveUserByEmailMatcher(reqEmail))
        .mockResolvedValue(Result.ok(user))
      userRepo.save
        .calledWith(
          new Matcher((u: User) => {
            return u.id.toValue() === user.id.toValue()
          }),
        )
        .mockResolvedValue(Result.oku())
      eventBus.publish
        .calledWith(
          new Matcher((events: DSEvent[]) => {
            return events.some(
              (event) =>
                event instanceof UserPasswordlessCodeByEmailRequested &&
                event.userId.toValue() === user.id.toValue() &&
                event.email === reqEmail &&
                event.token ===
                  user.state.tokenList
                    .getActiveTokens()!
                    .find((t: Token) => t.props.tempCode === event.token)!.props.tempCode,
            )
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
