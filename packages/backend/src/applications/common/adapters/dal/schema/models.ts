import { AuthUser } from "./db-introspection"
import { Model } from "objection"
import { TokenProps } from "../../../../../modules/authN/domain/aggregates/user/token.vo"
import { EmailProps } from "../../../../../modules/authN/domain/aggregates/user/email.vo"
import { Modify } from "@dddl/core/dist/common"

export type JsonObject = Record<string, string | number | boolean | undefined | null>
export type JsonObjectFrom<Base> = {
  [Key in keyof Base]: Base[Key] extends Date
    ? string
    : Base[Key] extends null
    ? null
    : Base[Key] extends Date | null
    ? string | null
    : Base[Key]
}

export type MergeModelAndDbJsonProps<Model, DBProps> = Modify<
  JsonObjectFrom<Model>,
  DBProps
> &
  DBProps

interface TokenDBDelta {
  value?: string
  tempCode?: string
  createdAt?: string
  updatedAt?: string
  deactivatedAt?: string | null
}

type TokenPropsTransient = MergeModelAndDbJsonProps<TokenProps, TokenDBDelta>

export interface AuthUserModel extends AuthUser {
  tokenList: TokenPropsTransient[]
  emailList: JsonObjectFrom<EmailProps>[]
}

export class AuthUserOModel extends Model implements AuthUserModel {
  id!: string
  createdAt!: Date
  updatedAt!: Date
  lastSeenAt!: Date
  deletedAt!: Date | null
  tokenList!: TokenPropsTransient[]
  emailList!: JsonObjectFrom<EmailProps>[]

  static get tableName(): string {
    return "auth_user"
  }

  static get jsonAttributes() {
    return ["emailList", "tokenList"]
  }
}
