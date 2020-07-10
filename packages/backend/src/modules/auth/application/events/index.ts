import { v4 } from "uuid"
import { UserId } from "../../domain/aggregates/user/user.id"
import { IntegrationEvent } from "@dddl/core/dist/eda"

export class UserRegistered extends IntegrationEvent {
  constructor(public readonly userId: UserId, public readonly email: string) {
    super(v4())
  }
}
