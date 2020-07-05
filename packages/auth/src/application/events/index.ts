import { v4 } from "uuid"
import { UserId } from "../../domain/aggregates/user/user.id"
import { IntegrationEvent } from "@dddl/eda"

export class UserRegistered extends IntegrationEvent {
  constructor(public readonly userId: UserId) {
    super(v4())
  }
}
