import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { LogoutCommand } from "./command"
import { Inject } from "typedi"
import { USER_REPOSITORY_DI_TOKEN, UserRepository } from "../../../domain/repositories"
import { CriticalErr, InvalidDataErr } from "@dddl/core/dist/errors"

export class Logout implements CommandHandler<LogoutCommand> {
  constructor(@Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository) {}

  async handle(req: CommandRequest<LogoutCommand>): EitherResultP {
    const userRes = await this.userRepo.getByPk({ value: req.data.userId })
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }
    if (!userRes.value) {
      return Result.error(new CriticalErr(`There is no user with this userId`))
    }

    const res = await userRes.value.deactivateAuthTokenByJWTToken(req.data.token)
    if (res.isError()) {
      return Result.error(res.error)
    }

    return Result.oku()
  }
}
