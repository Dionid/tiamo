import { GetUserByActiveEmail, UserRepository } from "../../../domain/repositories"
import { any, Matcher, mock, MockProxy } from "jest-mock-extended"
import { DSEvent, EventBus } from "@dddl/core/dist/eda"
import { UseCaseReqMeta, UseCaseRequest } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { Result } from "@dddl/core/dist/rop"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { UserPasswordlessCodeByEmailRequested, UserRegistered } from "../../events"
import { Specification } from "@dddl/core/dist/dal"
import { Token, TokenList } from "../../../domain/aggregates/user/token.vo"
import { UserId } from "../../../domain/aggregates/user/user.id"
import {
  LoginByPasswordlessCodeCommand,
  LoginByPasswordlessCodeCommandResponse,
} from "./command"
import { LoginByPasswordlessCode } from "./index"

describe("Register User paswordless", function () {
  let userRepo: MockProxy<UserRepository>
  let uc: LoginByPasswordlessCode
  let jwtToken = v4()
  const getActiveUserByEmailMatcher = (reqEmail: string) =>
    new Matcher((specs: Specification<User>[] | undefined) => {
      if (!specs) return false
      const spec = specs[0]
      return specs && spec instanceof GetUserByActiveEmail && spec.email === reqEmail
    })

  beforeEach(async () => {
    jwtToken = v4()
    userRepo = mock<UserRepository>()
    uc = new LoginByPasswordlessCode(userRepo, (id: string): string => jwtToken)
  })

  describe("if no User has been taken this active email", function () {
    it("should call eventbus with UserRegistered and UserCreated events and return undefined", async function () {
      const reqEmail = "test@mail.ru"
      const callerId = v4()
      const tempCode = "testtest"
      const req = new UseCaseRequest(
        new LoginByPasswordlessCodeCommand(tempCode, reqEmail),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      const tokenRes = await Token.create({
        createdAt: new Date(),
        updatedAt: new Date(),
        tempCode,
        jwtToken: undefined,
        deactivatedAt: null,
      })
      if (tokenRes.isError()) {
        throw tokenRes.error
      }
      const tokenListRes = await TokenList.create([tokenRes.value])
      if (tokenListRes.isError()) {
        throw tokenListRes.error
      }
      const user = await User.__createByRepository(new UserId(v4()), {
        tokenList: tokenListRes.value,
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
            return (
              u.id.toValue() === user.id.toValue() &&
              u.state.tokenList.getActiveTokens()![0].props.jwtToken === jwtToken
            )
          }),
        )
        .mockResolvedValue(Result.oku())
      const res = await uc.handle(req)
      if (res.isError()) {
        throw res.error
      }
      expect(res.value).toEqual(new LoginByPasswordlessCodeCommandResponse(jwtToken))
      expect(userRepo.getBySpecs.mock.calls.length).toEqual(1)
      expect(userRepo.save.mock.calls.length).toEqual(1)
    })
  })
})
