import { AggregateRootWithState } from "@dddl/domain"
import { UserId } from "./user.id"
import { OmitAndModify } from "@dddl/common"

export type UserState = OmitAndModify<AuthUser, { id: any }, {}>

export class User extends AggregateRootWithState<UserId, UserState> {}
