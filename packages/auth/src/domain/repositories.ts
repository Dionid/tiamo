import { User } from "./aggregates/user/user.aggregate"
import { Repository } from "@dddl/dal"
import { EitherResultP } from "@dddl/rop"

export interface UserRepository extends Repository<User> {
  getByActiveEmail(email: string): EitherResultP<User>
}

export const USER_REPOSITORY_DI_TOKEN = "USER_REPOSITORY_DI_TOKEN"
