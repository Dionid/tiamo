import { UserRepository } from "../../../domain/repositories"
import { any, Matcher, mock, MockProxy } from "jest-mock-extended"
import { DSEvent, EventBus } from "@dddl/eda"
import { EmailAlreadyTakenError, RegisterUserPasswordless } from "./index"
import { UseCaseReqMeta, UseCaseRequest } from "@dddl/usecase"
import { v4 } from "uuid"
import { RegisterUserPasswordlessCommand } from "./command"
import { Result } from "@dddl/rop"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { UserRegistered } from "../../events"
import { UserCreated } from "../../../domain/aggregates/user/user.events"

describe("Register User paswordless", function () {
  let userRepo: MockProxy<UserRepository>
  let eventBus: MockProxy<EventBus>
  let uc: RegisterUserPasswordless

  beforeEach(async () => {
    eventBus = mock<EventBus>()
    userRepo = mock<UserRepository>()
    uc = new RegisterUserPasswordless(eventBus, userRepo)
  })

  describe("if there is User with active this email", function () {
    it("should return error", async function () {
      const reqEmail = "test@mail.ru"
      const reqUserId = v4()
      const callerId = v4()
      const req = new UseCaseRequest(
        new RegisterUserPasswordlessCommand(reqEmail, reqUserId),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      userRepo.getByActiveEmail
        .calledWith(reqEmail)
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        .mockResolvedValue(Result.ok(new User()))
      const res = await uc.handle(req)
      if (!res.isError()) {
        throw new Error("not correct")
      }
      expect(res.error).toBe(EmailAlreadyTakenError)
      expect(userRepo.getByActiveEmail.mock.calls.length).toEqual(1)
      expect(userRepo.save.mock.calls.length).toEqual(0)
      expect(eventBus.publish.mock.calls.length).toEqual(0)
    })
  })

  describe("if no User has been taken this active email", function () {
    it("should call eventbus with UserRegistered and UserCreated events and return undefined", async function () {
      const reqEmail = "test@mail.ru"
      const reqUserId = v4()
      const callerId = v4()
      const req = new UseCaseRequest(
        new RegisterUserPasswordlessCommand(reqEmail, reqUserId),
        new UseCaseReqMeta({ callerId }),
        {},
      )
      userRepo.getByActiveEmail.calledWith(reqEmail).mockResolvedValue(Result.oku())
      userRepo.save
        .calledWith(
          new Matcher((user: User) => {
            return user.id.toValue() === reqUserId
          }),
        )
        .mockResolvedValue(Result.oku())
      eventBus.publish
        .calledWith(
          new Matcher((events: DSEvent[]) => {
            return (
              events.some(
                (event) =>
                  event instanceof UserRegistered && event.userId.toValue() === reqUserId,
              ) &&
              events.some(
                (event) =>
                  event instanceof UserCreated && event.userId.toValue() === reqUserId,
              )
            )
          }),
        )
        .mockResolvedValue(Result.oku())
      const res = await uc.handle(req)
      if (res.isError()) {
        throw res.error
      }
      expect(res.value).toBeUndefined()
      expect(userRepo.getByActiveEmail.mock.calls.length).toEqual(1)
      expect(userRepo.save.mock.calls.length).toEqual(1)
      expect(eventBus.publish.mock.calls.length).toEqual(1)
    })
  })
})
