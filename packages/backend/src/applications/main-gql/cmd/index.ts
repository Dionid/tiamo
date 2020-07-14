import "reflect-metadata"
import { Container } from "typedi"
import { ApolloServer } from "apollo-server"
import * as winston from "winston"
import dotenv from "dotenv"
import { format } from "winston"
import { LOGGER_DI_TOKEN } from "@dddl/core/dist/logger"
import knex from "knex"
import {
  KNEX_CONNECTION_DI_TOKEN,
  knexSnakeCaseMappers,
  TX_CONTAINER_DI_TOKEN,
  TxContainer,
} from "@dddl/knex/dist/dal"
import {
  ASYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
  EVENT_BUS_DI_TOKEN,
  EventBusProvider,
  EventBusPublisher,
  SYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
} from "@dddl/core/dist/eda"
import { CQ_BUS_DI_TOKEN } from "@dddl/core/dist/cqrs"
import { EventBusInMemoryProvider } from "@dddl/core/dist/eda-inmemory"
import { CQBus } from "@dddl/core/dist/cqrs-inmemory"
import {
  AsyncEventBusProviderSetMetaDecorator,
  AsyncEventBusProviderTransactionDecorator,
  LoggerDecorator,
  SyncEventBusProviderSetMetaDecorator,
  SyncEventBusProviderTransactionDecorator,
  ValidateRequestDecorator,
} from "@dddl/core/dist/usecase-decorators"
import { KnexTransactionDecorator } from "@dddl/knex/dist/usecase-decorators"
import { RegisterUserPasswordlessCommand } from "../../../modules/authN/application/commands/register-user-passwordless/command"
import { RegisterUserPasswordless } from "../../../modules/authN/application/commands/register-user-passwordless"
import {
  USER_REPOSITORY_DI_TOKEN,
  UserRepository as IUserRepository,
} from "../../../modules/authN/domain/repositories"
import { v4 } from "uuid"
import { schema } from "../adapters/gql/schema"
import { ResolversCtx } from "../adapters/gql/resolver-map"
import { UserORepository } from "../../common/adapters/dal/user-repository"
import { MailgunNotificationSender } from "../../../modules/notifications/adapters/mailgun"
import Mailgun from "mailgun-js"
import {
  NOTIFICATION_SENDER_DI_TOKEN,
  NotificationSender,
} from "../../../modules/notifications/application/notificationservice"
import { SendRegisterApprovalEmailCommand } from "../../../modules/notifications/application/command/send-register-approval-email/command"
import { SendRegisterApprovalEmail } from "../../../modules/notifications/application/command/send-register-approval-email"
import { initOrchestratorService } from "../../../modules/orchestration/export"
import { ApproveEmailByToken } from "../../../modules/authN/application/commands/approve-email-by-token"
import { ApproveEmailByTokenCommand } from "../../../modules/authN/application/commands/approve-email-by-token/command"
import { SendPasswordlessLoginCodeCommand } from "../../../modules/notifications/application/command/send-passwordless-login-code/command"
import { SendPasswordlessLoginCode } from "../../../modules/notifications/application/command/send-passwordless-login-code"
import { RequestPasswordlessCodeByEmailCommand } from "../../../modules/authN/application/commands/request-passwordless-code-by-email/command"
import { RequestPasswordlessCodeByEmail } from "../../../modules/authN/application/commands/request-passwordless-code-by-email"
import { LoginByPasswordlessCode } from "../../../modules/authN/application/commands/login-by-passwordless-code"
import { LoginByPasswordlessCodeCommand } from "../../../modules/authN/application/commands/login-by-passwordless-code/command"
import * as jwt from "jsonwebtoken"
import { JWT_CREATOR_DI_TOKEN } from "../../../modules/authN/application/jwtTokenCreator"
import { AuthClaims } from "./auth-claims"
import { UserId } from "../../../modules/authN/domain/aggregates/user/user.id"
import { TokenExpiredError } from "jsonwebtoken"
import { LogoutCommand } from "../../../modules/authN/application/commands/logout/command"
import { UseCaseReqMeta } from "@dddl/core/dist/usecase"
import { UnauthorizedErr } from "@dddl/core/dist/errors"
import { Logout } from "../../../modules/authN/application/commands/logout"
import { IsUserAuthTokenJwtTokenNotDeactivated } from "../../common/adapters/dal/token-qo"

interface Config {
  connectionString: string
  mailgunApiKey: string
  mailgunDomain: string
  jwtGenSecret: string
  jwtExpires: string
}

async function main() {
  // ENV
  dotenv.config()

  // ENV const
  const connectionString = process.env.MAIN_DB_CONNECTION_STRING
  if (!connectionString) {
    throw new Error("Env variable 'MAIN_DB_CONNECTION_STRING' is required")
  }
  const mailgunApiKey = process.env.MAILGUN_API_KEY
  if (!mailgunApiKey) {
    throw new Error("Env variable 'MAILGUN_API_KEY' is required")
  }
  const mailgunDomain = process.env.MAILGUN_DOMAIN
  if (!mailgunDomain) {
    throw new Error("Env variable 'MAILGUN_DOMAIN' is required")
  }
  const jwtGenSecret = process.env.JWT_GEN_SECRET
  if (!jwtGenSecret) {
    throw new Error("Env variable 'JWT_GEN_SECRET' is required")
  }
  const jwtExpires = process.env.JWT_EXPIRES
  if (!jwtExpires) {
    throw new Error("Env variable 'JWT_EXPIRES' is required")
  }
  const config: Config = {
    connectionString,
    mailgunApiKey,
    mailgunDomain,
    jwtGenSecret,
    jwtExpires,
  }

  // Utils
  const createJwtToken = (id: string): string => {
    return jwt.sign(
      {
        sub: id,
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": ["user"], // TODO. This must come from authZ
          "x-hasura-default-role": "user", // TODO. This must come from authZ
          "x-hasura-user-id": id,
        },
      },
      config.jwtGenSecret,
      { expiresIn: jwtExpires },
    )
  }
  Container.set({ id: JWT_CREATOR_DI_TOKEN, value: createJwtToken, global: true })

  // Logger
  const logger = winston.createLogger({
    format: format.combine(
      format.errors({ stack: true }),
      format.metadata(),
      format.json(),
    ),
    transports: [new winston.transports.Console()],
  })
  Container.set({ id: LOGGER_DI_TOKEN, value: logger, global: true })

  // DB
  const pg = knex({
    client: "pg",
    connection: connectionString,
    searchPath: ["knex", "public"],
    ...knexSnakeCaseMappers(),
  })
  Container.set({ id: KNEX_CONNECTION_DI_TOKEN, value: pg, global: true })

  // pg.on("query", function (...arg: any) {
  //   console.log("query")
  // })

  // EDA
  const syncEventBusProvider = new EventBusInMemoryProvider(true, logger)
  const asyncEventBusProvider = new EventBusInMemoryProvider(false, logger)
  Container.set([
    { id: EVENT_BUS_DI_TOKEN, type: EventBusPublisher },
    {
      id: SYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
      factory: (): EventBusProvider => syncEventBusProvider.fork(),
    },
    {
      id: ASYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
      factory: (): EventBusProvider => asyncEventBusProvider.fork(),
    },
  ])

  // CQRS
  const cqBus = new CQBus(logger)
  Container.set([{ id: CQ_BUS_DI_TOKEN, value: cqBus, global: true }])

  // Repos
  const txContainer = new TxContainer()
  Container.set({
    type: TxContainer,
    id: TX_CONTAINER_DI_TOKEN,
  })

  const userRepo: IUserRepository = new UserORepository(v4(), pg, txContainer)
  Container.set({
    type: UserORepository,
    id: USER_REPOSITORY_DI_TOKEN,
  })

  // Services
  const mailgunClient = new Mailgun({
    apiKey: mailgunApiKey,
    domain: mailgunDomain,
  })
  const mailgunService: NotificationSender = new MailgunNotificationSender(
    mailgunClient,
    logger,
  )
  Container.set({
    value: mailgunService,
    global: true,
    id: NOTIFICATION_SENDER_DI_TOKEN,
  })

  // UseCase Decorators
  cqBus.use(LoggerDecorator)
  cqBus.use(ValidateRequestDecorator)
  cqBus.use(AsyncEventBusProviderSetMetaDecorator)
  cqBus.use(AsyncEventBusProviderTransactionDecorator)
  cqBus.use(KnexTransactionDecorator)
  cqBus.use(SyncEventBusProviderSetMetaDecorator)
  cqBus.use(SyncEventBusProviderTransactionDecorator)

  // UseCases
  cqBus.subscribe(RegisterUserPasswordlessCommand, RegisterUserPasswordless)
  cqBus.subscribe(SendRegisterApprovalEmailCommand, SendRegisterApprovalEmail)
  cqBus.subscribe(ApproveEmailByTokenCommand, ApproveEmailByToken)
  cqBus.subscribe(RequestPasswordlessCodeByEmailCommand, RequestPasswordlessCodeByEmail)
  cqBus.subscribe(SendPasswordlessLoginCodeCommand, SendPasswordlessLoginCode)
  cqBus.subscribe(LoginByPasswordlessCodeCommand, LoginByPasswordlessCode)
  cqBus.subscribe(LogoutCommand, Logout)

  // Orchestration
  initOrchestratorService(syncEventBusProvider, asyncEventBusProvider)

  // Server
  const server = new ApolloServer({
    schema,
    context: async ({ req }): Promise<ResolversCtx> => {
      const headerToken = req.headers.authorization
      let reqUserId: UserId | undefined
      let token: string | undefined

      if (headerToken) {
        token = headerToken.split("Bearer ")[1]
        try {
          const decoded = jwt.verify(token, jwtGenSecret) as AuthClaims
          reqUserId = new UserId(decoded.sub)
          // . Check token not deactivated
          const existRes = await new IsUserAuthTokenJwtTokenNotDeactivated(
            pg,
            logger,
          ).handle(token)
          if (existRes.isError()) {
            throw existRes.error
          }
          if (!existRes.value) {
            throw new UnauthorizedErr()
          }
        } catch (e) {
          if (e instanceof TokenExpiredError) {
            const decoded = jwt.verify(token, jwtGenSecret, {
              ignoreExpiration: true,
            }) as AuthClaims
            await cqBus.handle(
              new LogoutCommand(new UserId(decoded.sub), token),
              new UseCaseReqMeta({
                callerId: decoded.sub,
              }),
            )
            throw new UnauthorizedErr()
          }
          throw e
        }
      }

      return {
        cqBus,
        userId: reqUserId,
        token,
      }
    },
    introspection: true,
    playground: true,
  })

  // FIRE
  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  NEW Server ready at ${url}`)
  })
}

main()
