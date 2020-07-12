import { ValueObject } from "@dddl/core/dist/domain"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { InvalidDataErr } from "@dddl/core/dist/errors"

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

  get isActive() {
    return !!this.props.deactivatedAt
  }

  public async setJWTToken(token: string): EitherResultP<Token> {
    return Token.create({
      ...this.props,
      jwtToken: token,
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

  public getActiveToken(): Token | undefined {
    const token = this.props.find((token) => token.isActive)
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
