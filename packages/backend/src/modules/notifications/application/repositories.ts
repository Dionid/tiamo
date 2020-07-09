import { Specification } from "@dddl/dal"
import { User } from "../../auth/domain/aggregates/user/user.aggregate"
import * as Joi from "@hapi/joi"
import { EitherResult, Result } from "@dddl/rop"
import { InvalidDataErr, PublicErr } from "@dddl/errors"

export class GetUserByActivatingEmailAndUserId extends Specification<User> {
  private constructor(public userId: string, public email: string) {
    super()
  }

  public static create(
    userId: string,
    email: string,
  ): EitherResult<GetUserByActivatingEmailAndUserId> {
    const errors: PublicErr[] = []
    const userIdErr = Joi.string().uuid().validate(userId)
    if (userIdErr.error) {
      errors.push(new InvalidDataErr(userIdErr.error.message))
    }
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
