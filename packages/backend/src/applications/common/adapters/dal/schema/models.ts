import { AuthUser, AuthUserEmail, AuthUserToken } from "./db-introspection"

export interface AuthUserModel extends AuthUser {
  tokenList: AuthUserToken[] | null
  emailList: Record<keyof AuthUserEmail, string | number | boolean>[] | null
  emails: Record<string, string | number | boolean>[]
}
