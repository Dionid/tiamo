import { ValueObject } from "@dddl/core/dist/domain"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { CriticalErr, InvalidDataErr } from "@dddl/core/dist/errors"

export interface TokenProps {
  createdAt: Date
  updatedAt: Date
  tempCode: string
  jwtToken?: string
  deactivatedAt: Date | null
}

export class Token extends ValueObject<TokenProps> {
  public static async create(props: TokenProps): EitherResultP<Token, Error[]> {
    // TODO. Add validations
    // ...
    return Result.ok(new Token(props))
  }

  get isActive(): boolean {
    return !this.props.deactivatedAt
  }

  public async setJWTToken(token: string): EitherResultP<Token> {
    return Token.create({
      ...this.props,
      jwtToken: token,
    })
  }

  public async deactivate(): EitherResultP<Token> {
    if (!this.isActive) {
      return Result.error(
        new InvalidDataErr("Can't deactivate already deactivated token!"),
      )
    }
    return Result.ok(
      new Token({
        ...this.props,
        deactivatedAt: new Date(),
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

  public getActiveTokens(): Token[] | undefined {
    return this.props.filter((token) => token.isActive)
  }

  public async deactivateToken(token: Token): EitherResultP<TokenList> {
    if (!token.isActive) {
      return Result.error(new CriticalErr(`Token is not active`))
    }

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
