import { GraphQLResolveInfo } from "graphql"
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: any }> = { [K in keyof T]: T[K] }
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } &
  { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type Query = {
  __typename?: "Query"
  dummy?: Maybe<Scalars["String"]>
}

export type MutationResponse = {
  __typename?: "MutationResponse"
  success: Scalars["Boolean"]
  message?: Maybe<Scalars["String"]>
}

export type RegisterUser = {
  email: Scalars["String"]
}

export type ApproveEmailByToken = {
  token: Scalars["String"]
  email: Scalars["String"]
}

export type RequestPasswordlessCodeByEmail = {
  email: Scalars["String"]
}

export type LoginByPasswordlessCode = {
  email: Scalars["String"]
  code: Scalars["String"]
}

export type LoginByPasswordlessCodeResponse = {
  __typename?: "LoginByPasswordlessCodeResponse"
  token: Scalars["String"]
}

export type Mutation = {
  __typename?: "Mutation"
  registerUser?: Maybe<MutationResponse>
  approveEmailByToken?: Maybe<MutationResponse>
  requestPasswordlessCodeByEmail?: Maybe<MutationResponse>
  loginByPasswordlessCode?: Maybe<LoginByPasswordlessCodeResponse>
  logout?: Maybe<MutationResponse>
}

export type MutationRegisterUserArgs = {
  req?: Maybe<RegisterUser>
}

export type MutationApproveEmailByTokenArgs = {
  req?: Maybe<ApproveEmailByToken>
}

export type MutationRequestPasswordlessCodeByEmailArgs = {
  req?: Maybe<RequestPasswordlessCodeByEmail>
}

export type MutationLoginByPasswordlessCodeArgs = {
  req?: Maybe<LoginByPasswordlessCode>
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type StitchingResolver<TResult, TParent, TContext, TArgs> =
  | LegacyStitchingResolver<TResult, TParent, TContext, TArgs>
  | NewStitchingResolver<TResult, TParent, TContext, TArgs>
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {}
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}> = (
  obj: T,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Query: ResolverTypeWrapper<{}>
  String: ResolverTypeWrapper<Scalars["String"]>
  MutationResponse: ResolverTypeWrapper<MutationResponse>
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]>
  RegisterUser: RegisterUser
  ApproveEmailByToken: ApproveEmailByToken
  RequestPasswordlessCodeByEmail: RequestPasswordlessCodeByEmail
  LoginByPasswordlessCode: LoginByPasswordlessCode
  LoginByPasswordlessCodeResponse: ResolverTypeWrapper<LoginByPasswordlessCodeResponse>
  Mutation: ResolverTypeWrapper<{}>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Query: {}
  String: Scalars["String"]
  MutationResponse: MutationResponse
  Boolean: Scalars["Boolean"]
  RegisterUser: RegisterUser
  ApproveEmailByToken: ApproveEmailByToken
  RequestPasswordlessCodeByEmail: RequestPasswordlessCodeByEmail
  LoginByPasswordlessCode: LoginByPasswordlessCode
  LoginByPasswordlessCodeResponse: LoginByPasswordlessCodeResponse
  Mutation: {}
}

export type QueryResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]
> = {
  dummy?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
}

export type MutationResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["MutationResponse"] = ResolversParentTypes["MutationResponse"]
> = {
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
  message?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type LoginByPasswordlessCodeResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["LoginByPasswordlessCodeResponse"] = ResolversParentTypes["LoginByPasswordlessCodeResponse"]
> = {
  token?: Resolver<ResolversTypes["String"], ParentType, ContextType>
  __isTypeOf?: IsTypeOfResolverFn<ParentType>
}

export type MutationResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]
> = {
  registerUser?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationRegisterUserArgs, never>
  >
  approveEmailByToken?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationApproveEmailByTokenArgs, never>
  >
  requestPasswordlessCodeByEmail?: Resolver<
    Maybe<ResolversTypes["MutationResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationRequestPasswordlessCodeByEmailArgs, never>
  >
  loginByPasswordlessCode?: Resolver<
    Maybe<ResolversTypes["LoginByPasswordlessCodeResponse"]>,
    ParentType,
    ContextType,
    RequireFields<MutationLoginByPasswordlessCodeArgs, never>
  >
  logout?: Resolver<Maybe<ResolversTypes["MutationResponse"]>, ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
  Query?: QueryResolvers<ContextType>
  MutationResponse?: MutationResponseResolvers<ContextType>
  LoginByPasswordlessCodeResponse?: LoginByPasswordlessCodeResponseResolvers<ContextType>
  Mutation?: MutationResolvers<ContextType>
}

/**
 * @deprecated
 * Use "Resolvers" root object instead. If you wish to get "IResolvers", add "typesPrefix: I" to your config.
 */
export type IResolvers<ContextType = any> = Resolvers<ContextType>
