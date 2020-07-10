import { Specification } from "@dddl/core/dist/dal"
import { User } from "../../authN/domain/aggregates/user/user.aggregate"
import * as Joi from "@hapi/joi"
import { EitherResult, Result } from "@dddl/core/dist/rop"
import { InvalidDataErr, PublicErr } from "@dddl/core/dist/errors"
import { UserId } from "../../authN/domain/aggregates/user/user.id"

export class GetUserByActivatingEmailAndUserId extends Specification<User> {
  private constructor(public userId: UserId, public email: string) {
    super()
  }

  public static create(
    userId: UserId,
    email: string,
  ): EitherResult<GetUserByActivatingEmailAndUserId> {
    const errors: PublicErr[] = []
    const emailErr = Joi.string().email().validate(email)
    if (emailErr.error) {
      errors.push(new InvalidDataErr(emailErr.error.message))
    }
    if (errors.length) {
      return Result.error(errors)
    }
    return Result.ok(new GetUserByActivatingEmailAndUserId(userId, email))
  }
}
