import { ValueObject } from "@dddl/core/dist/domain"
import { EitherResult, EitherResultP, Result } from "@dddl/core/dist/rop"
import { InvalidDataErr } from "@dddl/core/dist/errors"
import { v4 } from "uuid"

export interface TokenProps {
  createdAt: Date
  updatedAt: Date
  tempCode: string
  jwtToken: string | null
  active: boolean
  deactivatedAt: Date | null
}

export class Token extends ValueObject<TokenProps> {
  public static async create(props: TokenProps): EitherResultP<Token, Error[]> {
    // TODO. Add validations
    // ...
    return Result.ok(new Token(props))
  }

  public async releaseNewJwtToken(): EitherResultP<Token> {
    return Token.create({
      ...this.props,
      jwtToken: v4(),
    })
  }

  public async deactivate(): EitherResultP<Token> {
    if (this.props.deactivatedAt) {
      return Result.error(
        new InvalidDataErr("Can't deactivate already deactivated token!"),
      )
    }
    return Result.ok(
      new Token({
        ...this.props,
        deactivatedAt: new Date(),
        active: false,
      }),
    )
  }
}

export class TokenList extends ValueObject<Token[]> {
  private constructor(public props: Token[]) {
    super(props)
  }

  public static async create(props: Token[]): EitherResultP<TokenList> {
    // TODO. Validate
    // ...
    return Result.ok(new TokenList(props))
  }

  public async releaseNewJwtToken(token: Token): EitherResultP<TokenList> {
    const newToken = await token.releaseNewJwtToken()
    if (newToken.isError()) {
      return Result.error(newToken.error)
    }
    return TokenList.create(
      this.props.map((t) => {
        if (t.equals(token)) {
          return newToken.value
        }
        return t
      }),
    )
  }

  public getActiveToken(): Token | undefined {
    const token = this.props.find((token) => token.props.active)
    return token
  }

  public async deactivateActiveToken(token: Token): EitherResultP<TokenList> {
    const result = await token.deactivate()
    if (result.isError()) {
      return Result.error(result.error)
    }

    return TokenList.create(
      this.props.map((t) => {
        if (t.equals(token)) {
          return result.value
        }
        return t
      }),
    )
  }

  public addToken(token: Token): EitherResultP<TokenList> {
    return TokenList.create([...this.props, token])
  }
}
