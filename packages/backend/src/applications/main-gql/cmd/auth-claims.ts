export interface AuthClaims {
  sub: string
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": string[]
    "x-hasura-default-role": string
    "x-hasura-user-id": string
  }
}
