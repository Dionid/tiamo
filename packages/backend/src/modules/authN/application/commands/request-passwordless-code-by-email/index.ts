import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { RequestPasswordlessCodeByEmailCommand } from "./command"
import { Inject } from "typedi"
import { EVENT_BUS_DI_TOKEN, EventBus } from "@dddl/core/dist/eda"
import {
  GetUserByActiveEmail,
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../domain/repositories"
import { UserPasswordlessCodeByEmailRequested } from "../../events"
import { InvalidDataErr } from "@dddl/core/dist/errors"

export class RequestPasswordlessCodeByEmail
  implements CommandHandler<RequestPasswordlessCodeByEmailCommand> {
  constructor(
    @Inject(EVENT_BUS_DI_TOKEN) private eventBus: EventBus,
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  async handle(
    req: CommandRequest<RequestPasswordlessCodeByEmailCommand>,
  ): EitherResultP {
    // . Get User by activated email
    const userRes = await this.userRepo.getBySpecs([
      new GetUserByActiveEmail(req.data.email),
    ])
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }
    if (!userRes.value) {
      return Result.error(new InvalidDataErr(`No user with email: ${req.data.email}`))
    }

    // . Release new Token
    const tokenRes = await userRes.value.releaseNewToken()
    if (tokenRes.isError()) {
      return Result.error(tokenRes.error)
    }

    // . Save User
    const res = await this.userRepo.save(userRes.value)
    if (res.isError()) {
      return Result.error(res.error)
    }

    // . Send events
    return this.eventBus.publish([
      ...userRes.value.domainEvents,
      new UserPasswordlessCodeByEmailRequested(
        userRes.value.id,
        tokenRes.value.props.tempCode,
        req.data.email,
      ),
    ])
  }
}
