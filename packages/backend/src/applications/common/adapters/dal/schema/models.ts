import { AuthUser } from "./db-introspection"

export interface AuthUserModel extends AuthUser {
  tokenList: Record<string, string | number | boolean | null>[]
  emailList: Record<string, string | number | boolean | null>[]
}
