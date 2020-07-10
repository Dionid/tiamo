import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { LoginPasswordlessByEmailCommand } from "./command"
import { Inject } from "typedi"
import { EVENT_BUS_DI_TOKEN, EventBus } from "@dddl/core/dist/eda"
import {
  GetUserByActiveEmail,
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../domain/repositories"
import { UserPasswordlessLoginedByToken } from "../../events"
import { User } from "../../../domain/aggregates/user/user.aggregate"

export class LoginPasswordlessByEmail
  implements CommandHandler<LoginPasswordlessByEmailCommand> {
  constructor(
    @Inject(EVENT_BUS_DI_TOKEN) private eventBus: EventBus,
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  async handle(req: CommandRequest<LoginPasswordlessByEmailCommand>): EitherResultP {
    // . Get User by activated email
    const userRes: User = await this.userRepo.getBySpecs([
      new GetUserByActiveEmail(req.data.email),
    ])
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }

    // . Release new Token
    const tokenRes = await userRes.releaseNewToken()
    if (tokenRes.isError()) {
      return Result.error(tokenRes.error)
    }

    // . Save User
    const res = await this.userRepo.save(userRes)
    if (res.isError()) {
      return Result.error(res.error)
    }

    // . Send events
    return this.eventBus.publish(
      ...userRes.value.domainevents,
      new UserPasswordlessLoginedByToken(token.state.value),
    )
  }
}
