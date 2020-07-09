import { AuthUser } from "./db-introspection"
import { Model } from "objection"

export interface AuthUserModel extends AuthUser {
  tokenList: Record<string, string | number | boolean | null>[]
  emailList: Record<string, string | number | boolean | null>[]
}

export class AuthUserOModel extends Model implements AuthUserModel {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  lastSeenAt!: Date
  deletedAt!: Date | null
  tokenList!: Record<string, string | number | boolean | null>[]
  emailList!: Record<string, string | number | boolean | null>[]

  static get tableName(): string {
    return "auth_user"
  }

  static get jsonAttributes() {
    return ["emailList", "tokenList"]
  }
}
