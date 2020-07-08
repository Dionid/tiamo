import {
  AggregateMapper,
  KNEX_CONNECTION_DI_TOKEN,
  KnexRepositoryBase,
  TX_CONTAINER_DI_TOKEN,
  TxContainer,
} from "@dddl/dal-knex"
import { UserId } from "../../../../modules/auth/domain/aggregates/user/user.id"
import {
  User,
  UserState,
} from "../../../../modules/auth/domain/aggregates/user/user.aggregate"
import { Inject } from "typedi"
import { v4 } from "uuid"
import { Specification } from "@dddl/dal"
import { AuthUserModel } from "./schema/models"
import {
  Token,
  TokenList,
} from "../../../../modules/auth/domain/aggregates/user/token.vo"
import { EitherResultP, Result } from "@dddl/rop"
import {
  Email,
  EmailStatus,
} from "../../../../modules/auth/domain/aggregates/user/email.vo"
import Knex from "knex"
import { GetUserByActiveEmail } from "../../../../modules/auth/domain/repositories"

class UserSpecMapper {
  static map(
    query: Knex.QueryBuilder<AuthUserModel>,
    specs: Specification<User>[],
  ): Knex.QueryBuilder<AuthUserModel> {
    // Add Relations
    const resultQuery = query
      .select("*")
      .select(
        query.client.raw(
          "(select json_agg(email) from (select * from auth_user_email where user_id = auth_user.id) as email) as email_list",
        ),
      )
      .select(
        query.client.raw(
          "(select json_agg(token) from (select * from auth_user_token where user_id = auth_user.id) as token) as token_list",
        ),
      )
    // .leftJoin("auth_user_email", { "auth_user_email.user_id": "auth_user.id" })
    // .leftJoin("auth_user_token", { "auth_user_token.user_id": "auth_user.id" })
    // . Add specs
    specs.forEach((spec) => {
      // if (spec instanceof GetUserByActiveEmail) {
      //   resultQuery = query.whereRaw(
      //     "auth_user_email.value = ? AND auth_user_email.status = ?",
      //     [spec.email, EmailStatus.activated],
      //   )
      // }
    })
    return resultQuery
  }
}

class UserAggregateMapper {
  static async to(model: AuthUserModel): EitherResultP<User> {
    const tokens: Token[] = []
    if (model.tokenList) {
      for (let i = 0; i < model.tokenList.length; i++) {
        const token = model.tokenList[i]
        const tokenRes = await Token.create(token)
        if (tokenRes.isError()) {
          return Result.error(tokenRes.error)
        }
        tokens.push(tokenRes.value)
      }
    }
    const tokenListRes = await TokenList.create(tokens)
    if (tokenListRes.isError()) {
      return Result.error(tokenListRes.error)
    }

    const emailList: Email[] = []
    if (model.emailList) {
      for (let i = 0; i < model.emailList.length; i++) {
        const email = model.emailList[i]
        const emailRes = await Email.__createByRepository({
          id: email.id as string,
          createdAt: new Date(email.createdAt as string),
          updatedAt: new Date(email.updatedAt as string),
          testN: email.testN as number,
          value: email.value as string,
          approved: email.approved as boolean,
          status: email.status as EmailStatus,
        })
        if (emailRes.isError()) {
          return Result.error(emailRes.error)
        }

        emailList.push(emailRes.value)
      }
    }

    return Result.ok(
      User.__createByRepository(new UserId(model.id), {
        ...model,
        tokenList: tokenListRes.value,
        emailList: emailList,
        emails: emailList,
      }),
    )
  }

  static async from(aggregate: User): EitherResultP<AuthUserModel> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ...rest } = aggregate.state
    return Result.ok({
      ...rest,
      id: aggregate.id.toValue() + "",
      tokenList: aggregate.state.tokenList.props.map((token) => ({
        ...token.props,
        userId: aggregate.id.toValue(),
      })),
      emailList: aggregate.state.emailList.map((email) => ({
        ...email.props,
        createdAt: email.props.createdAt + "",
        updatedAt: email.props.updatedAt + "",
        userId: aggregate.id.toValue(),
      })),
      emails: aggregate.state.emailList.map((email) => ({
        ...email.props,
        createdAt: email.props.createdAt + "",
        updatedAt: email.props.updatedAt + "",
        userId: aggregate.id.toValue(),
      })),
    })
  }
}

export class UserRepository extends KnexRepositoryBase<
  User,
  UserState,
  UserId,
  AuthUserModel
> {
  constructor(
    id: string,
    @Inject(KNEX_CONNECTION_DI_TOKEN) knex: Knex,
    @Inject(TX_CONTAINER_DI_TOKEN) txContainer: TxContainer,
  ) {
    super(
      id || v4(),
      knex,
      "auth_user",
      "id",
      UserSpecMapper,
      UserAggregateMapper,
      txContainer,
    )
  }
}
