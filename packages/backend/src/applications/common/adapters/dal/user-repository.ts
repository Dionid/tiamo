import {
  KNEX_CONNECTION_DI_TOKEN,
  TX_CONTAINER_DI_TOKEN,
  TxContainer,
} from "@dddl/knex/dist/dal"
import { UserId } from "../../../../modules/authN/domain/aggregates/user/user.id"
import {
  User,
  UserState,
} from "../../../../modules/authN/domain/aggregates/user/user.aggregate"
import { Inject } from "typedi"
import { v4 } from "uuid"
import { Specification } from "@dddl/core/dist/dal"
import { AuthUserModel, AuthUserOModel } from "./schema/models"
import {
  Token,
  TokenList,
} from "../../../../modules/authN/domain/aggregates/user/token.vo"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import {
  Email,
  EmailStatus,
} from "../../../../modules/authN/domain/aggregates/user/email.vo"
import Knex from "knex"
import {
  GetUserByActiveEmail,
  GetUserByApprovingEmailAndToken,
} from "../../../../modules/authN/domain/repositories"
import { ObjectionRepositoryBase } from "./objection-repository"
import { QueryBuilderType } from "objection"
import { GetUserByActivatingEmailAndUserId } from "../../../../modules/notifications/application/repositories"
import { CriticalErr } from "@dddl/core/dist/errors"

class UserSpecMapper {
  static map(
    query: QueryBuilderType<AuthUserOModel>,
    specs: Specification<User>[],
  ): QueryBuilderType<AuthUserOModel> {
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
      } else if (spec instanceof GetUserByActivatingEmailAndUserId) {
        resultQuery = query
          .whereRaw(
            `email_list @> '[{"value": ${JSON.stringify(
              spec.email,
            )}, "status": ${JSON.stringify(EmailStatus.activating)}}]'`,
          )
          .where({ id: spec.userId.toString() })
      } else if (spec instanceof GetUserByApprovingEmailAndToken) {
        resultQuery = query.whereRaw(
          `email_list @> '[{"value": ${JSON.stringify(
            spec.email,
          )}, "status": ${JSON.stringify(
            EmailStatus.activating,
          )}, "token": ${JSON.stringify(spec.token)}}]'`,
        )
      } else {
        throw new CriticalErr(
          `This specification hasn't been done: ${spec.constructor.name}`,
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
        const { createdAt, updatedAt, value, deactivatedAt, jwtToken } = token
        let { tempCode } = token
        if (value && !tempCode) {
          tempCode = value
        }
        if (!tempCode) {
          return Result.error(new CriticalErr(`There is no tempCode in: ${token}`))
        }
        const tokenRes = await Token.create({
          createdAt: new Date(createdAt || new Date()),
          updatedAt: new Date(updatedAt || new Date()),
          tempCode: tempCode,
          deactivatedAt: new Date(deactivatedAt || new Date()),
          jwtToken: jwtToken,
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
          createdAt: email.createdAt ? new Date(email.createdAt as string) : new Date(),
          updatedAt: email.updatedAt ? new Date(email.updatedAt as string) : new Date(),
          value: email.value as string,
          approved: email.approved as boolean,
          status: email.status as EmailStatus,
          token: email.token as string,
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

  static async from(aggregate: User): EitherResultP<AuthUserOModel> {
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
    return Result.ok(AuthUserOModel.fromJson(model))
  }
}

export class UserORepository extends ObjectionRepositoryBase<
  User,
  UserState,
  UserId,
  AuthUserOModel
> {
  constructor(
    id: string,
    @Inject(KNEX_CONNECTION_DI_TOKEN) knex: Knex,
    @Inject(TX_CONTAINER_DI_TOKEN) txContainer: TxContainer,
  ) {
    super(
      id || v4(),
      knex,
      AuthUserOModel,
      UserSpecMapper,
      UserAggregateMapper,
      txContainer,
    )
  }
}
