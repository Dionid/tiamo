import { AggregateRootWithState } from "@dddl/core/dist/domain"
import { UserId } from "./user.id"
import { OmitAndModify } from "@dddl/core/dist/common"
import { Token, TokenList } from "./token.vo"
import { Email, EmailStatus } from "./email.vo"
import { UserCreated } from "./user.events"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { v4 } from "uuid"
import { AuthUserModel } from "../../../../../applications/common/adapters/dal/schema/models"
import { InvalidDataErr } from "@dddl/core/dist/errors"

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
      token: v4(),
    })

    if (emailOrFail.isError()) {
      return Result.combineErrorAndFlat(emailOrFail)
    }

    const tokenListOrFail = await TokenList.create([])
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
    const approvedEmailRes = await em.approve()
    if (approvedEmailRes.isError()) {
      return Result.error(approvedEmailRes.error)
    }
    const approvedAndActivatedEmailRes = await approvedEmailRes.value.activate()
    if (approvedAndActivatedEmailRes.isError()) {
      return Result.error(approvedAndActivatedEmailRes.error)
    }
    this.state.emailList[emailIndex] = approvedAndActivatedEmailRes.value
    return Result.oku()
  }

  async releaseNewToken(): EitherResultP<Token> {
    const activeToken = this.state.tokenList.getActiveToken()
    if (activeToken) {
      const res = await this.state.tokenList.deactivateActiveToken(activeToken)
      if (res.isError()) {
        return Result.error(res.error)
      }
      this.state.tokenList = res.value
    }

    const newToken = await Token.create({
      createdAt: new Date(),
      updatedAt: new Date(),
      value: v4(),
      active: true,
      deactivatedAt: null,
    })
    if (newToken.isError()) {
      return Result.error(newToken.error)
    }

    const newTokenList = await this.state.tokenList.addToken(newToken.value)
    if (newTokenList.isError()) {
      return Result.error(newTokenList.error)
    }
    this.state.tokenList = newTokenList.value

    return Result.ok(newToken.value)
  }
}
