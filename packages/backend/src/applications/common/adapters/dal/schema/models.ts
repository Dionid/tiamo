import { AuthUser, AuthUserEmail, AuthUserToken } from "./db-introspection"

export interface AuthUserModel extends AuthUser {
  tokenList: AuthUserToken[]
  emailList: AuthUserEmail[]
}
