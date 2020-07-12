import { HybridHandler, HybridRequest } from "@dddl/core/dist/cqrs"
import {
  LoginByPasswordlessCodeCommand,
  LoginByPasswordlessCodeCommandResponse,
} from "./command"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { Inject } from "typedi"
import { EVENT_BUS_DI_TOKEN, EventBus } from "@dddl/core/dist/eda"
import {
  GetUserByActiveEmail,
  USER_REPOSITORY_DI_TOKEN,
  UserRepository,
} from "../../../domain/repositories"
import { CriticalErr, InvalidDataErr } from "@dddl/core/dist/errors"

export class LoginByPasswordlessCode
  implements
    HybridHandler<
      LoginByPasswordlessCodeCommand,
      LoginByPasswordlessCodeCommandResponse
    > {
  constructor(
    @Inject(EVENT_BUS_DI_TOKEN) private eventBus: EventBus,
    @Inject(USER_REPOSITORY_DI_TOKEN) private userRepo: UserRepository,
  ) {}

  async handle(
    req: HybridRequest<
      LoginByPasswordlessCodeCommand,
      LoginByPasswordlessCodeCommandResponse
    >,
  ): EitherResultP<LoginByPasswordlessCodeCommandResponse> {
    const { email, code } = req.data

    // . Get User by email
    const userRes = await this.userRepo.getBySpecs([new GetUserByActiveEmail(email)])
    if (userRes.isError()) {
      return Result.error(userRes.error)
    }
    if (!userRes.value) {
      return Result.error(
        new InvalidDataErr(`There is no user with active email: ${email}`),
      )
    }

    // . Accept code and release new JWT token
    const res = await userRes.value.acceptTempCodeAndReleaseJWTToken(
      "1h", // TODO. Move to config
      "6f0d48d7-697b-4476-a0fb-7245cc5a005d", // TODO. Move to config
      code,
    )
    if (res.isError()) {
      return Result.error(res.error)
    }

    // . Get active token by code
    const tokenList = await userRes.value.state.tokenList.getActiveTokens()
    if (!tokenList) {
      return Result.error(new CriticalErr(`No tokenlist in User: ${userRes.value}`))
    }
    const token = tokenList.filter((t) => t.props.tempCode === code)[0]
    if (!token) {
      return Result.error(
        new CriticalErr(`Active token doesn't exist on user: ${userRes.value.id}`),
      )
    }
    if (!token.props.jwtToken) {
      return Result.error(
        new CriticalErr(
          `Active token doesn't have jwtToken on user: ${userRes.value.id}`,
        ),
      )
    }

    // . Save User
    const saveRes = await this.userRepo.save(userRes.value)
    if (saveRes.isError()) {
      return Result.error(saveRes.error)
    }

    // . Return jwt token
    return Result.ok(new LoginByPasswordlessCodeCommandResponse(token.props.jwtToken))
  }
}
