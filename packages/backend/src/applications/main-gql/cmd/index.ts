import "reflect-metadata"
import { Container } from "typedi"
import { ApolloServer } from "apollo-server"
import * as winston from "winston"
import dotenv from "dotenv"
import { format } from "winston"
import { LOGGER_DI_TOKEN } from "@dddl/logger"
import knex from "knex"
import {
  KNEX_CONNECTION_DI_TOKEN,
  knexSnakeCaseMappers,
  TX_CONTAINER_DI_TOKEN,
  TxContainer,
} from "@dddl/dal-knex"
import {
  ASYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
  EVENT_BUS_DI_TOKEN,
  EventBusProvider,
  EventBusPublisher,
  SYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
} from "@dddl/eda"
import { CQ_BUS_DI_TOKEN } from "@dddl/cqrs"
import { EventBusInMemoryProvider } from "@dddl/eda-inmemory"
import { CQBus } from "@dddl/cqrs-inmemory"
import {
  AsyncEventBusProviderSetMetaDecorator,
  AsyncEventBusProviderTransactionDecorator,
  LoggerDecorator,
  SyncEventBusProviderSetMetaDecorator,
  SyncEventBusProviderTransactionDecorator,
  ValidateRequestDecorator,
} from "@dddl/usecase-decorators"
import { KnexTransactionDecorator } from "@dddl/usecase-decorators-knex"
import { RegisterUserPasswordlessCommand } from "../../../modules/auth/application/commands/register-user-passwordless/command"
import { RegisterUserPasswordless } from "../../../modules/auth/application/commands/register-user-passwordless"
import { UserRepository as IUserRepository } from "../../../modules/auth/domain/repositories"
import { v4 } from "uuid"
import { UserRepository } from "../../common/adapters/dal/user-repository"
import { schema } from "../adapters/gql/schema"
import { ResolversCtx } from "../adapters/gql/resolver-map"

async function main() {
  // ENV
  dotenv.config()

  // ENV const
  const connectionString = process.env.MAIN_DB_CONNECTION_STRING
  if (!connectionString) {
    throw new Error("Env variable 'MAIN_DB_CONNECTION_STRING' is required")
  }

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

  // EDA
  const syncEventBusProvider = new EventBusInMemoryProvider(true, logger)
  const asyncEventBusProvider = new EventBusInMemoryProvider(false, logger)
  // const eventBus: IEventBus = new EventBus(syncEventBusProvider, asyncEventBusProvider)
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

  const userRepo: IUserRepository = new UserRepository(v4(), pg, txContainer)

  // UseCases
  cqBus.use(LoggerDecorator)
  cqBus.use(ValidateRequestDecorator)
  cqBus.use(AsyncEventBusProviderSetMetaDecorator)
  cqBus.use(AsyncEventBusProviderTransactionDecorator)
  cqBus.use(KnexTransactionDecorator)
  cqBus.use(SyncEventBusProviderSetMetaDecorator)
  cqBus.use(SyncEventBusProviderTransactionDecorator)

  cqBus.subscribe(RegisterUserPasswordlessCommand, RegisterUserPasswordless)

  const server = new ApolloServer({
    schema,
    context: async ({ req }): Promise<ResolversCtx> => {
      return {
        cqBus,
      }
    },
    introspection: true,
    playground: true,
  })

  server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀  NEW Server ready at ${url}`)
  })
}

main()
