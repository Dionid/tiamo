import { CommandHandler, CommandRequest } from "@dddl/cqrs"
import { RegisterUserPasswordlessCommand } from "./command"
import { EitherResultP, Result } from "@dddl/rop"
import { EVENT_BUS_DI_TOKEN, EventBus } from "@dddl/eda"
import { Inject } from "typedi"
import { UseCaseReqMeta } from "@dddl/usecase"
import { User } from "../../../domain/aggregates/user/user.aggregate"
import { UserRegistered } from "../../events"
import { UserId } from "../../../domain/aggregates/user/user.id"
import {
  GetUserByActiveEmail,
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../domain/repositories"
import { InvalidDataErr } from "@dddl/errors"

export const EmailAlreadyTakenError = new InvalidDataErr("Email is already taken")

export class RegisterUserPasswordless
  implements CommandHandler<RegisterUserPasswordlessCommand> {
  constructor(
    @Inject(EVENT_BUS_DI_TOKEN) private eventBus: EventBus,
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  protected async registerNewUser(
    data: RegisterUserPasswordlessCommand,
    meta: UseCaseReqMeta,
  ): EitherResultP<User> {
    // . Create new User
    const userOrF = await User.createByUser({
      id: new UserId(data.userId),
      email: data.email,
    })
    if (userOrF.isError()) {
      return Result.error(userOrF.error)
    }

    // . Save to DB
    const res = await this.userRepo.save(userOrF.value)
    if (res.isError()) {
      return Result.error(res.error)
    }

    return userOrF
  }

  protected async getOrRegisterUser(
    data: RegisterUserPasswordlessCommand,
    meta: UseCaseReqMeta,
  ): EitherResultP<User> {
    const curUser = await this.userRepo.getBySpecs([new GetUserByActiveEmail(data.email)])
    if (curUser.isError()) {
      return Result.error(curUser.error)
    }
    if (!curUser.value) {
      return await this.registerNewUser(data, meta)
    }
    return Result.error(EmailAlreadyTakenError)
  }

  async handle(req: CommandRequest<RegisterUserPasswordlessCommand>): EitherResultP {
    const { data, meta } = req

    // . Get or register user
    const user = await this.getOrRegisterUser(data, meta)
    if (user.isError()) {
      return Result.error(user.error)
    }

    // . Publish events
    await this.eventBus.publish([
      ...user.value.domainEvents,
      new UserRegistered(user.value.id),
    ])

    return Result.oku()
  }
}
