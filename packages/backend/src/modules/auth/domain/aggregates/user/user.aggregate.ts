import { AggregateRootWithState } from "@dddl/domain"
import { UserId } from "./user.id"
import { OmitAndModify } from "@dddl/common"
import { Token, TokenList } from "./token.vo"
import { Email, EmailStatus } from "./email.vo"
import { UserCreated } from "./user.events"
import { EitherResultP, Result } from "@dddl/rop"
import { v4 } from "uuid"
import { AuthUserModel } from "../../../../../applications/common/adapters/dal/schema/models"
import { InvalidDataErr } from "@dddl/errors"

export type UserState = OmitAndModify<
  AuthUserModel,
  { id: any },
  {
    tokenList: TokenList
    emailList: Email[]
  }
>

export class User extends AggregateRootWithState<UserId, UserState> {
  public static __createByRepository(id: UserId, state: UserState) {
    return new User(id, state)
  }

  public static async create(id: UserId, state: UserState): EitherResultP<User> {
    const user = new User(id, state)
    user.addDomainEvent(new UserCreated(user.id))
    return Result.ok(user)
  }

  public static async createByUser(props: {
    id: UserId
    email: string
  }): EitherResultP<User> {
    // . Validate
    // ...

    const emailOrFail = await Email.create({
      value: props.email,
      status: EmailStatus.activating,
      approved: false,
    })
    const tokenOrFail = await Token.create({
      value: v4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      active: true,
      deactivatedAt: null,
    })

    if (emailOrFail.isError() || tokenOrFail.isError()) {
      return Result.combineErrorAndFlat(emailOrFail, tokenOrFail)
    }

    const tokenListOrFail = await TokenList.create([tokenOrFail.value])
    if (tokenListOrFail.isError()) {
      return Result.error(tokenListOrFail.error)
    }

    const userProps: UserState = {
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeenAt: new Date(),
      deletedAt: null,
      tokenList: tokenListOrFail.value,
      emailList: [emailOrFail.value],
    }

    return User.create(props.id, userProps)
  }

  async approveAndActivateEmail(email: string): EitherResultP {
    const emailIndex = this.state.emailList.findIndex((em) => em.props.value === email)
    const em = this.state.emailList[emailIndex]
    if (!em) {
      return Result.error(new InvalidDataErr(`There is no email like: ${email}`))
    }
    const activatedEmailRes = await em.activate()
    if (activatedEmailRes.isError()) {
      return Result.error(activatedEmailRes.error)
    }
    const approvedAndActivatedEmailRes = await activatedEmailRes.value.approve()
    if (approvedAndActivatedEmailRes.isError()) {
      return Result.error(approvedAndActivatedEmailRes.error)
    }
    this.state.emailList[emailIndex] = approvedAndActivatedEmailRes.value
    return Result.oku()
  }
}
