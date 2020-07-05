import { User } from "./aggregates/user/user.aggregate"
import { Repository, Specification } from "@dddl/dal"
import { EitherResultP } from "@dddl/rop"

export class GetUserByActiveEmail extends Specification<User> {
  constructor(public email: string) {
    super()
  }
}

export interface UserRepository extends Repository<User> {}

export const USER_REPOSITORY_DI_TOKEN = "USER_REPOSITORY_DI_TOKEN"
