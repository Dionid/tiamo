import "graphql-import-node"
import * as typeDefs from "./schema.graphql"
import { makeExecutableSchema } from "graphql-tools"
import { GraphQLSchema } from "graphql"
import { resolvers } from "./resolver-map"

const schema: GraphQLSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

export { schema }
