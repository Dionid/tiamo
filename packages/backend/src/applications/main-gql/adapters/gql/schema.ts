import "graphql-import-node"
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import * as typeDefs from "./schema.graphql"
import { makeExecutableSchema } from "graphql-tools"
import { GraphQLSchema } from "graphql"
import { resolvers } from "./resolver-map"

const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

export { schema }
