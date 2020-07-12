import { v4 } from "uuid"

export interface JwtTokenCreator {
  (id: string): string
}

export const JWT_CREATOR_DI_TOKEN = v4()
