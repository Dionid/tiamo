import {
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
    let resultQuery = query
    // . Add specs
    specs.forEach((spec) => {
      if (spec instanceof GetUserByActiveEmail) {
        resultQuery = query.whereRaw(
          `email_list @> '[{"value": ${JSON.stringify(spec.email)}, "status": ${JSON.stringify(EmailStatus.activated)}}]'`,
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
    const model: AuthUserModel = {
      ...aggregate.state,
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

  async before(model: AuthUserModel): Promise<AuthUserModel> {
    for (const [key, val] of Object.entries(model)) {
      if (Array.isArray(val) || (typeof val === "object" && val !== null && !(val instanceof Date))) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        model[key] = JSON.stringify(val)
      }
    }
    return model
  }

  async beforeUpdate(model: AuthUserModel): Promise<AuthUserModel> {
    return this.before(model)
  }

  async beforeCreate(model: AuthUserModel): Promise<AuthUserModel> {
    return this.before(model)
  }

  async update(aggregate: User): EitherResultP {
    try {
      const modelRes = await this.aggregateMapper.from(aggregate)
      if (modelRes.isError()) {
        return Result.error(modelRes.error)
      }
      const model = await this.beforeUpdate(modelRes.value)
      await this.executer(this.tableName)
        .where({
          [this.pkName]: aggregate.getStringId(),
        })
        .update(model)
      return Result.oku()
    } catch (e) {
      return Result.error(e)
    }
  }

  async create(aggregate: User): EitherResultP {
    try {
      const modelRes = await this.aggregateMapper.from(aggregate)
      if (modelRes.isError()) {
        return Result.error(modelRes.error)
      }
      const model = await this.beforeCreate(modelRes.value)
      await this.executer(this.tableName).insert(model)
      aggregate.isTransient = false
      return Result.oku()
    } catch (e) {
      return Result.error(e)
    }
  }
}
