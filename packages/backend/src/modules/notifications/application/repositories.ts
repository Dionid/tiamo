import { Specification } from "@dddl/dal"
import { User } from "../../auth/domain/aggregates/user/user.aggregate"
import * as Joi from "@hapi/joi"
import { EitherResult, Result } from "@dddl/rop"
import { InvalidDataErr, PublicErr } from "@dddl/errors"
import { UserId } from "../../auth/domain/aggregates/user/user.id"

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
