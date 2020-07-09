import {AuthUser, AuthUserRole} from "./db-introspection"
import { Model } from "objection"

export interface AuthUserModel extends AuthUser {
  tokenList: Record<string, string | number | boolean | null>[]
  emailList: Record<string, string | number | boolean | null>[]
}

export class AuthUserRoleOModel extends Model implements AuthUserRole {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  name!: string
  userId!: string

  static get tableName(): string {
    return "auth_user_role"
  }
}

export class AuthUserOModel extends Model implements AuthUserModel {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  lastSeenAt!: Date
  deletedAt!: Date | null
  tokenList!: Record<string, string | number | boolean | null>[]
  emailList!: Record<string, string | number | boolean | null>[]
  roles!: AuthUserRoleOModel[]

  static get tableName(): string {
    return "auth_user"
  }

  static get jsonAttributes() {
    return ["emailList", "tokenList"]
  }

  static relationMappings = {
    roles: {
      relation: Model.HasManyRelation,
      modelClass: AuthUserRoleOModel,
      join: {
        from: "auth_user.id",
        to: "auth_user_role.userId",
      },
    },
  }
}
