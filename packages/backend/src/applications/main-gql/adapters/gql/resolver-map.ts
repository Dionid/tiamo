import { IResolvers } from "apollo-server"
import { CQBus } from "@dddl/cqrs"
import { RegisterUserPasswordlessCommand } from "../../../../modules/auth/application/commands/register-user-passwordless/command"
import { UseCaseReqMeta } from "@dddl/usecase"
import { v4 } from "uuid"

export interface ResolversCtx {
  cqBus: CQBus
}

export const resolvers: IResolvers<any, ResolversCtx> = {
  Mutation: {
    registerUser: async (root, { req }, ctx) => {
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
  },
}
