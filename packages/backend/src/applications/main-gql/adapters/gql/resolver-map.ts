import { IResolvers } from "apollo-server"
import { CQBus } from "@dddl/core/dist/cqrs"
import { RegisterUserPasswordlessCommand } from "../../../../modules/authN/application/commands/register-user-passwordless/command"
import { UseCaseReqMeta } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { ApproveEmailByTokenCommand } from "../../../../modules/authN/application/commands/approve-token/command"
import { RequestPasswordlessCodeByEmailCommand } from "../../../../modules/authN/application/commands/request-passwordless-code-by-email/command"
import { ApproveEmailByTokenInput, RegisterUserInput } from "./types"

export interface ResolversCtx {
  cqBus: CQBus
}

interface Result {
  success: boolean
}

export const resolvers: IResolvers<any, ResolversCtx> = {
  Mutation: {
    registerUser: async (
      root,
      { req }: { req: RegisterUserInput },
      ctx,
    ): Promise<Result> => {
      const userId = v4()
      const res = await ctx.cqBus.handle(
        new RegisterUserPasswordlessCommand(req.email, userId),
        new UseCaseReqMeta({
          callerId: userId,
        }),
      )
      if (res.isError()) {
        console.error(res)
        throw res.error
      }
      return {
        success: true,
      }
    },
    approveEmailByToken: async (
      root,
      { req }: { req: ApproveEmailByTokenInput },
      ctx,
    ): Promise<Result> => {
      const res = await ctx.cqBus.handle(
        new ApproveEmailByTokenCommand(req.email, req.token),
        new UseCaseReqMeta({}),
      )
      if (res.isError()) {
        console.error(res)
        throw res.error
      }
      return {
        success: true,
      }
    },
    loginPasswordlessByEmail: async (root, { req }, ctx): Promise<Result> => {
      const res = await ctx.cqBus.handle(
        new RequestPasswordlessCodeByEmailCommand(req.email),
        new UseCaseReqMeta({}),
      )
      if (res.isError()) {
        console.error(res)
        throw res.error
      }
      return {
        success: true,
      }
    },
  },
}
