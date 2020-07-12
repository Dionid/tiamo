import { AggregateRootWithState } from "@dddl/core/dist/domain"
import { UserId } from "./user.id"
import { OmitAndModify } from "@dddl/core/dist/common"
import { Token, TokenList } from "./token.vo"
import { Email, EmailStatus } from "./email.vo"
import { UserCreated } from "./user.events"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { v4 } from "uuid"
import { AuthUserModel } from "../../../../../applications/common/adapters/dal/schema/models"
import { CriticalErr, InvalidDataErr } from "@dddl/core/dist/errors"
import * as jwt from "jsonwebtoken"
import { EmailAlreadyApprovedErr } from "./errors"

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

    // . Create email
    const emailOrFail = await Email.create({
      value: props.email,
      status: EmailStatus.activating,
      approved: false,
      token: v4(),
    })
    if (emailOrFail.isError()) {
      return Result.combineErrorAndFlat(emailOrFail)
    }

    // . Create token
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

    // . Return User
    return User.create(props.id, userProps)
  }

  async approveAndActivateEmail(email: string): EitherResultP {
    // . Find email
    const emailIndex = this.state.emailList.findIndex((em) => em.props.value === email)
    const em = this.state.emailList[emailIndex]

    // . If no email, than there is a problem
    if (!em) {
      return Result.error(new InvalidDataErr(`There is no email like: ${email}`))
    }

    // . Check if it is already approved
    if (em.props.approved) {
      return Result.error(EmailAlreadyApprovedErr)
    }

    // . Approve email
    const approvedEmailRes = await em.approve()
    if (approvedEmailRes.isError()) {
      return Result.error(approvedEmailRes.error)
    }

    // . Activate email
    const approvedAndActivatedEmailRes = await approvedEmailRes.value.activate()
    if (approvedAndActivatedEmailRes.isError()) {
      return Result.error(approvedAndActivatedEmailRes.error)
    }
    // . Set new email
    this.state.emailList[emailIndex] = approvedAndActivatedEmailRes.value
    // . Return success
    return Result.oku()
  }

  async releaseNewToken(): EitherResultP<Token> {
    // . Create new token
    const newToken = await Token.create({
      createdAt: new Date(),
      updatedAt: new Date(),
      tempCode: v4(),
      deactivatedAt: null,
      jwtToken: "",
    })
    if (newToken.isError()) {
      return Result.error(newToken.error)
    }

    // . Add new token to list
    const newTokenList = await this.state.tokenList.addToken(newToken.value)
    if (newTokenList.isError()) {
      return Result.error(newTokenList.error)
    }
    this.state.tokenList = newTokenList.value

    // . Return success
    return Result.ok(newToken.value)
  }

  public async acceptTempCodeAndReleaseJWTToken(
    expiresIn: string,
    secret: string,
    tempCode: string,
  ): EitherResultP {
    // . Get currently active token
    const activeTokens = this.state.tokenList.getActiveTokens()
    if (!activeTokens) {
      return Result.error(
        new CriticalErr(`There is no active token on user: ${this.id.value}`),
      )
    }

    // . Check code
    const activeToken = activeTokens.filter((t) => t.props.tempCode === tempCode)[0]
    if (!activeToken) {
      return Result.error(new InvalidDataErr(`Code isn't correct`))
    }

    // . If jwt token already exist than stop
    if (activeToken.props.jwtToken) {
      return Result.error(
        new InvalidDataErr(`JWT token was already used. Login to get new one`),
      )
    }

    // . Create jwt token
    const token = jwt.sign(
      {
        sub: this.id.toValue(),
        // TODO. Think where to move this
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": ["user"], // TODO. This must come from authZ
          "x-hasura-default-role": "user", // TODO. This must come from authZ
          "x-hasura-user-id": this.id.toValue(),
        },
      },
      secret,
      { expiresIn },
    )

    // . Set it to active token
    const newActiveTokenRes = await activeToken.setJWTToken(token)
    if (newActiveTokenRes.isError()) {
      return Result.error(newActiveTokenRes.error)
    }

    // . Set new tokenList
    const tokenListRes = await TokenList.create(
      this.state.tokenList.props.map((t: Token) => {
        if (t.props.tempCode === newActiveTokenRes.value.props.tempCode) {
          return newActiveTokenRes.value
        }
        return t
      }),
    )
    if (tokenListRes.isError()) {
      return Result.error(tokenListRes.error)
    }
    this.state.tokenList = tokenListRes.value

    // . Return success
    return Result.oku()
  }
}
