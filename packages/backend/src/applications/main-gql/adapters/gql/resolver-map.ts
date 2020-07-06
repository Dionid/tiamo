import { IResolvers } from "apollo-server"
import { CQBus } from "@dddl/cqrs"
import { RegisterUserPasswordlessCommand } from "../../../../modules/auth/application/commands/register-user-passwordless/command"
import { UseCaseReqMeta } from "@dddl/usecase"

export interface ResolversCtx {
  cqBus: CQBus
}

export const resolvers: IResolvers<any, ResolversCtx> = {
  Mutation: {
    registerUser: async (root, { req }, ctx) => {
      const res = await ctx.cqBus.handle(
        new RegisterUserPasswordlessCommand(req.email, req.userId),
        new UseCaseReqMeta({
          callerId: "",
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
  },
}
