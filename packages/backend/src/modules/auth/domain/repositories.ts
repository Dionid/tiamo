import { User } from "./aggregates/user/user.aggregate"
import { Repository, Specification } from "@dddl/core/dist/dal"
import { EitherResultP } from "@dddl/core/dist/rop"

export class GetUserByActiveEmail extends Specification<User> {
  constructor(public email: string) {
    super()
  }
}

export class GetUserByApprovingEmailAndToken extends Specification<User> {
  constructor(public email: string, public token: string) {
    super()
  }
}

export interface UserRepository extends Repository<User> {}

export const USER_REPOSITORY_DI_TOKEN = "USER_REPOSITORY_DI_TOKEN"
