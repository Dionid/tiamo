import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { ApproveEmailByTokenCommand } from "./command"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { Inject } from "typedi"
import { EVENT_BUS_DI_TOKEN, EventBus } from "@dddl/core/dist/eda"
import {
  GetUserByApprovingEmailAndToken,
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../domain/repositories"
import { InvalidDataErr } from "@dddl/core/dist/errors"

export class ApproveEmailByToken implements CommandHandler<ApproveEmailByTokenCommand> {
  constructor(
    @Inject(EVENT_BUS_DI_TOKEN) private eventBus: EventBus,
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  async handle(req: CommandRequest<ApproveEmailByTokenCommand>): EitherResultP {
    // . Get User by token and approving email
    const userRes = await this.userRepo.getBySpecs([
      new GetUserByApprovingEmailAndToken(req.data.email, req.data.token),
    ])
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }
    if (!userRes.value) {
      return Result.error(
        new InvalidDataErr(
          `There is no user with email: ${req.data.email} and token: ${req.data.token}`,
        ),
      )
    }

    // . Activate email
    const activationRes = await userRes.value.approveAndActivateEmail(req.data.email)
    if (activationRes.isError()) {
      return Result.error(activationRes.error)
    }

    // . Save user
    const res = await this.userRepo.save(userRes.value)
    if (res.isError()) {
      return Result.error(res.error)
    }

    // . Send events
    return await this.eventBus.publish(userRes.value.domainEvents)
  }
}
