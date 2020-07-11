import { IResolvers } from "apollo-server"
import { CQBus } from "@dddl/core/dist/cqrs"
import { RegisterUserPasswordlessCommand } from "../../../../modules/authN/application/commands/register-user-passwordless/command"
import { UseCaseReqMeta } from "@dddl/core/dist/usecase"
import { v4 } from "uuid"
import { ApproveEmailByTokenCommand } from "../../../../modules/authN/application/commands/approve-token/command"
import { RequestPasswordlessCodeByEmailCommand } from "../../../../modules/authN/application/commands/request-passwordless-code-by-email/command"
import {
  LoginByPasswordlessCodeResponse,
  MutationApproveEmailByTokenArgs,
  MutationLoginByPasswordlessCodeArgs,
  MutationRegisterUserArgs,
  MutationRequestPasswordlessCodeByEmailArgs,
} from "./types"
import { LoginByPasswordlessCodeCommand } from "../../../../modules/authN/application/commands/login-by-passwordless-code/command"
import { CriticalErr } from "@dddl/core/dist/errors"

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
      { req }: MutationRegisterUserArgs,
      ctx,
    ): Promise<Result> => {
      if (!req) {
        throw new CriticalErr(`No input`)
      }
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
      { req }: MutationApproveEmailByTokenArgs,
      ctx,
    ): Promise<Result> => {
      if (!req) {
        throw new CriticalErr(`No input`)
      }
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
    requestPasswordlessCodeByEmail: async (
      root,
      { req }: MutationRequestPasswordlessCodeByEmailArgs,
      ctx,
    ): Promise<Result> => {
      if (!req) {
        throw new CriticalErr(`No input`)
      }
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
    loginByPasswordlessCode: async (
      root,
      { req }: MutationLoginByPasswordlessCodeArgs,
      ctx,
    ): Promise<LoginByPasswordlessCodeResponse> => {
      if (!req) {
        throw new CriticalErr(`No input`)
      }
      const res = await ctx.cqBus.handle<LoginByPasswordlessCodeResponse>(
        new LoginByPasswordlessCodeCommand(req.code, req.email),
        new UseCaseReqMeta({}),
      )
      if (res.isError()) {
        console.error(res)
        throw res.error
      }
      return {
        token: res.value.token,
      }
    },
  },
}
