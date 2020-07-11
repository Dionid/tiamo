import { v4 } from "uuid"
import { UserId } from "../../domain/aggregates/user/user.id"
import { IntegrationEvent } from "@dddl/core/dist/eda"

export class UserRegistered extends IntegrationEvent {
  constructor(public readonly userId: UserId, public readonly email: string) {
    super(v4())
  }
}

export class UserApprovedEmailByToken extends IntegrationEvent {
  constructor(public readonly userId: UserId, public readonly email: string) {
    super(v4())
  }
}

export class UserPasswordlessCodeByEmailRequested extends IntegrationEvent {
  constructor(
    public readonly userId: UserId,
    public readonly token: string,
    public readonly email: string,
  ) {
    super(v4())
  }
}
