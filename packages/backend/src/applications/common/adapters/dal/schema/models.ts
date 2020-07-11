import { AuthUser } from "./db-introspection"
import { Model } from "objection"

type JSONObject = Record<string, string | number | boolean | undefined | null>

export interface AuthUserModel extends AuthUser {
  tokenList: JSONObject[]
  emailList: JSONObject[]
}

export class AuthUserOModel extends Model implements AuthUserModel {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  lastSeenAt!: Date
  deletedAt!: Date | null
  tokenList!: JSONObject[]
  emailList!: JSONObject[]

  static get tableName(): string {
    return "auth_user"
  }

  static get jsonAttributes() {
    return ["emailList", "tokenList"]
  }
}
