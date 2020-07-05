import {DomainEvent} from "@dddl/eda"
import {UserId} from "./user.id"
import {v4} from "uuid"

export class UserCreated extends DomainEvent {
    constructor(public readonly userId: UserId) {
        super(v4())
    }
}
