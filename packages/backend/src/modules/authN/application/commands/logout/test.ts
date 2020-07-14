import { UserRepository } from "../../../domain/repositories"
import { Matcher, mock, MockProxy } from "jest-mock-extended"
import { UseCaseReqMeta, UseCaseRequest } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { Result } from "@dddl/core/dist/rop"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { Token, TokenList } from "../../../domain/aggregates/user/token.vo"
import { UserId } from "../../../domain/aggregates/user/user.id"
import { EventBus } from "@dddl/core/dist/eda"
import { Logout } from "./index"
import { LogoutCommand } from "./command"

describe("Register User paswordless", function () {
  let userRepo: MockProxy<UserRepository>
  let eventBus: MockProxy<EventBus>
  let uc: Logout

  beforeEach(async () => {
    eventBus = mock<EventBus>()
    userRepo = mock<UserRepository>()
    uc = new Logout(userRepo)
  })

  describe("if no User has been taken this active email", function () {
    it("should call eventbus with UserRegistered and UserCreated events and return undefined", async function () {
      const callerId = v4()
      const token = v4()
      const req = new UseCaseRequest(
        new LogoutCommand(new UserId(callerId), token),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      const tokenRes = await Token.create({
        createdAt: new Date(),
        updatedAt: new Date(),
        tempCode: "tempCode",
        jwtToken: token,
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
      userRepo.getByPk
        .calledWith(new Matcher((v) => v.value === callerId))
        .mockResolvedValue(Result.ok(user))
      userRepo.save
        .calledWith(
          new Matcher((u: User) => {
            return (
              u.id.toValue() === user.id.toValue() &&
              !user.state.tokenList.props[0].isActive
            )
          }),
        )
        .mockResolvedValue(Result.oku())
      const res = await uc.handle(req)
      if (res.isError()) {
        throw res.error
      }
      expect(res.value).toBeUndefined()
      expect(userRepo.getByPk.mock.calls.length).toEqual(1)
      expect(userRepo.save.mock.calls.length).toEqual(1)
    })
  })
})
