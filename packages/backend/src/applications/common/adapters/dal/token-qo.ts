import { ServiceObject } from "@dddl/core/dist/serviceobject"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { Inject } from "typedi"
import { KNEX_CONNECTION_DI_TOKEN } from "@dddl/knex/dist/dal"
import Knex from "knex"
import { AuthUserOModel } from "./schema/models"
import { LOGGER_DI_TOKEN, Logger } from "@dddl/core/dist/logger"

export class IsUserAuthTokenJwtTokenNotDeactivated
  implements ServiceObject<EitherResultP<boolean>> {
  constructor(
    @Inject(KNEX_CONNECTION_DI_TOKEN) private knex: Knex,
    @Inject(LOGGER_DI_TOKEN) private logger: Logger,
  ) {}

  async handle(jwtToken: string): EitherResultP<boolean> {
    const model: AuthUserOModel[] = await AuthUserOModel.query(this.knex).whereRaw(
      `token_list @> '[{"jwtToken": ${JSON.stringify(
        jwtToken,
      )}, "deactivatedAt": null}]'`,
    )
    if (model.length > 1) {
      this.logger.warning(`More than 1 users with jwttoken: ${jwtToken}`)
    }
    return Result.ok(model.length === 1)
  }
}
