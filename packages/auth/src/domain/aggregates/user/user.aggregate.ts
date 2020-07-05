import { AggregateRootWithState } from "@dddl/domain"
import { UserId } from "./user.id"
import { OmitAndModify } from "@dddl/common"
import {AuthUser} from "../../../adapters/dal/schema/db-introspection"

export type UserState = OmitAndModify<AuthUser, { id: any }, {}>

export class User extends AggregateRootWithState<UserId, UserState> {}
