import {
  KNEX_CONNECTION_DI_TOKEN,
  KnexRepositoryBase,
  KnexRepositoryWithJsonColumnsMixin,
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
import {AuthUserModel, AuthUserOModel} from "./schema/models"
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
import {AuthUser} from "./schema/db-introspection"

class UserSpecMapper {
  static map(
    query: Knex.QueryBuilder<AuthUserModel>,
    specs: Specification<User>[],
  ): Knex.QueryBuilder<AuthUserModel> {
    // Add Relations
    let resultQuery = query
    // . Add specs
    specs.forEach((spec) => {
      if (spec instanceof GetUserByActiveEmail) {
        resultQuery = query.whereRaw(
          `email_list @> '[{"value": ${JSON.stringify(
            spec.email,
          )}, "status": ${JSON.stringify(EmailStatus.activated)}}]'`,
        )
      }
    })
    return resultQuery
  }
}

class UserAggregateMapper {
  static async to(model: AuthUserModel): EitherResultP<User> {
    const tokenList: Token[] = []
    if (model.tokenList) {
      for (let i = 0; i < model.tokenList.length; i++) {
        const token = model.tokenList[i]
        const tokenRes = await Token.create({
          createdAt: new Date(token.createdAt as string),
          updatedAt: new Date(token.updatedAt as string),
          value: token.value as string,
          active: token.active as boolean,
          deactivatedAt: new Date(token.deactivatedAt as string),
        })
        if (tokenRes.isError()) {
          return Result.error(tokenRes.error)
        }
        tokenList.push(tokenRes.value)
      }
    }
    const tokenListRes = await TokenList.create(tokenList)
    if (tokenListRes.isError()) {
      return Result.error(tokenListRes.error)
    }

    const emailList: Email[] = []
    if (model.emailList) {
      for (let i = 0; i < model.emailList.length; i++) {
        const email = model.emailList[i]
        const emailRes = await Email.__createByRepository({
          createdAt: new Date(email.createdAt as string),
          updatedAt: new Date(email.updatedAt as string),
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
      }),
    )
  }

  static async from(aggregate: User): EitherResultP<AuthUserModel> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tokenList, emailList, ...rest } = aggregate.state
    const model: AuthUserModel = {
      ...rest,
      id: aggregate.id.toValue() + "",
      tokenList: aggregate.state.tokenList.props.map((token) => ({
        ...token.props,
        createdAt: token.props.createdAt.toJSON(),
        updatedAt: token.props.updatedAt.toJSON(),
        deactivatedAt: token.props.deactivatedAt?.toJSON() || null,
      })),
      emailList: aggregate.state.emailList.map((email) => ({
        ...email.props,
        createdAt: email.props.createdAt.toJSON(),
        updatedAt: email.props.updatedAt.toJSON(),
      })),
    }
    return Result.ok(model)
  }
}

export class UserRepository extends KnexRepositoryWithJsonColumnsMixin<
  User,
  UserState,
  UserId,
  AuthUserModel
>(["emailList", "tokenList"], KnexRepositoryBase) {
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

  async create(aggregate: User): EitherResultP {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tokenList, emailList, ...rest } = aggregate.state
      const json: AuthUser = {
        ...rest,
        id: aggregate.id.toValue() + "",
        tokenList: aggregate.state.tokenList.props.map((token) => ({
          ...token.props,
          createdAt: token.props.createdAt.toJSON(),
          updatedAt: token.props.updatedAt.toJSON(),
          deactivatedAt: token.props.deactivatedAt?.toJSON() || null,
        })),
        emailList: aggregate.state.emailList.map((email) => ({
          ...email.props,
          createdAt: email.props.createdAt.toJSON(),
          updatedAt: email.props.updatedAt.toJSON(),
        })),
      }
      const model = AuthUserOModel.fromJson(json)
      await model.$query(this.executer).insert()
      return Result.oku()
    } catch (e) {
      return Result.error(e)
    }
  }

  async getBySpecs(specs: Specification<User>[]): EitherResultP<User | undefined> {
    let query = AuthUserOModel.query(this.executer)
    specs.forEach((spec) => {
      if (spec instanceof GetUserByActiveEmail) {
        query = query.whereRaw(
          `email_list @> '[{"value": ${JSON.stringify(
            spec.email,
          )}, "status": ${JSON.stringify(EmailStatus.activated)}}]'`,
        )
      }
    })
    const users = await query
    const model = users[0]
    if (!model) {
      return Result.oku()
    }

    const tokenList: Token[] = []
    if (model.tokenList) {
      for (let i = 0; i < model.tokenList.length; i++) {
        const token = model.tokenList[i]
        const tokenRes = await Token.create({
          createdAt: new Date(token.createdAt as string),
          updatedAt: new Date(token.updatedAt as string),
          value: token.value as string,
          active: token.active as boolean,
          deactivatedAt: new Date(token.deactivatedAt as string),
        })
        if (tokenRes.isError()) {
          return Result.error(tokenRes.error)
        }
        tokenList.push(tokenRes.value)
      }
    }
    const tokenListRes = await TokenList.create(tokenList)
    if (tokenListRes.isError()) {
      return Result.error(tokenListRes.error)
    }

    const emailList: Email[] = []
    if (model.emailList) {
      for (let i = 0; i < model.emailList.length; i++) {
        const email = model.emailList[i]
        const emailRes = await Email.__createByRepository({
          createdAt: new Date(email.createdAt as string),
          updatedAt: new Date(email.updatedAt as string),
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

    const aggregate = User.__createByRepository(new UserId(model.id), {
      ...model,
      tokenList: tokenListRes.value,
      emailList: emailList,
    })

    aggregate.isTransient = false

    return Result.ok(aggregate)
  }
}
