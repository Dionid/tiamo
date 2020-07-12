import { User } from "./user.aggregate"
import { UserId } from "./user.id"
import { v4 } from "uuid"
import { Token, TokenList } from "./token.vo"
import { Email, EmailStatus } from "./email.vo"
import { EmailAlreadyApprovedErr } from "./errors"

describe("User aggregate", function () {
  describe("createByUser method", function () {
    describe("with correct email", function () {
      it("should create new User", async function () {
        const res = await User.createByUser({
          id: new UserId(v4()),
          email: "test@mail.ru",
        })
        if (res.isError()) {
          throw res.error
        }
        expect(res.value).toBeInstanceOf(User)
        expect(res.value.domainEvents.length).toBe(1)
        expect(res.value.state.tokenList.props.length).toBe(0)
      })
    })

    describe("with incorrect email", function () {
      it("should return error", async function () {
        const res = await User.createByUser({ id: new UserId(v4()), email: "blablabla" })
        if (!res.isError()) {
          throw new Error("must be error")
        }
        if (!Array.isArray(res.error)) {
          throw new Error("must be array")
        }
        expect(res.error.length).toBe(1)
        expect(res.error[0].message).toBe("Email is incorrect!")
      })
    })
  })
  describe("releaseNewToken method", function () {
    it("should create and add new Token to TokenList", async function () {
      const tokenListRes = await TokenList.create([])
      if (tokenListRes.isError()) {
        throw tokenListRes.error
      }
      const emailRes = await Email.create({
        value: "test@mail.com",
        status: EmailStatus.activating,
        approved: false,
        token: v4(),
      })
      if (emailRes.isError()) {
        throw emailRes.error
      }
      const user = await User.__createByRepository(new UserId(v4()), {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSeenAt: new Date(),
        deletedAt: new Date(),
        tokenList: tokenListRes.value,
        emailList: [emailRes.value],
      })
      const token = await user.releaseNewToken()
      if (token.isError()) {
        throw token.error
      }
      expect(token.value).toBeInstanceOf(Token)
      expect(
        user.state.tokenList.getActiveTokens()!.some((t) => t === token.value),
      ).toBeTruthy()
    })
  })
  describe("acceptTempCodeAndReleaseJWTToken method", function () {
    describe("if temp code is correct", function () {
      it("should create jwt token and assign it to auth token with the same temp code", async function () {
        const tempCode = "testtest"
        const jwtToken = "jwtToken"
        const tokenRes = await Token.create({
          createdAt: new Date(),
          updatedAt: new Date(),
          tempCode,
          jwtToken: undefined,
          deactivatedAt: null,
        })
        if (tokenRes.isError()) {
          throw tokenRes.error
        }
        const tokenListRes = await TokenList.create([tokenRes.value])
        if (tokenListRes.isError()) {
          throw tokenListRes.error
        }
        const emailRes = await Email.create({
          value: "test@mail.com",
          status: EmailStatus.activating,
          approved: false,
          token: v4(),
        })
        if (emailRes.isError()) {
          throw emailRes.error
        }
        const user = await User.__createByRepository(new UserId(v4()), {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeenAt: new Date(),
          deletedAt: new Date(),
          tokenList: tokenListRes.value,
          emailList: [emailRes.value],
        })
        const res = await user.acceptTempCodeAndReleaseJWTToken(
          tempCode,
          (id: string): string => jwtToken,
        )
        if (res.isError()) {
          throw res.error
        }
        expect(res.value).toBeUndefined()
        expect(
          user.state.tokenList
            .getActiveTokens()!
            .find((t) => t.props.tempCode === tempCode)!.props.jwtToken,
        ).toEqual(jwtToken)
      })
    })
  })
  describe("approveAndActivateEmail method", function () {
    describe("if email exist in email list", function () {
      it("should activate and approve email", async function () {
        const tokenListRes = await TokenList.create([])
        if (tokenListRes.isError()) {
          throw tokenListRes.error
        }
        const emailRes = await Email.create({
          value: "test@mail.com",
          status: EmailStatus.activating,
          approved: false,
          token: v4(),
        })
        if (emailRes.isError()) {
          throw emailRes.error
        }
        const user = await User.__createByRepository(new UserId(v4()), {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeenAt: new Date(),
          deletedAt: new Date(),
          tokenList: tokenListRes.value,
          emailList: [emailRes.value],
        })
        const res = await user.approveAndActivateEmail("test@mail.com")
        if (res.isError()) {
          throw res.error
        }
        expect(res.value).toBeUndefined()
        expect(user.state.emailList[0].props.approved).toBeTruthy()
        expect(user.state.emailList[0].props.status).toBe(EmailStatus.activated)
      })
      it("should return error if email already approved", async function () {
        const tokenListRes = await TokenList.create([])
        if (tokenListRes.isError()) {
          throw tokenListRes.error
        }
        const emailRes = await Email.create({
          value: "test@mail.com",
          status: EmailStatus.activated,
          approved: true,
          token: v4(),
        })
        if (emailRes.isError()) {
          throw emailRes.error
        }
        const user = await User.__createByRepository(new UserId(v4()), {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeenAt: new Date(),
          deletedAt: new Date(),
          tokenList: tokenListRes.value,
          emailList: [emailRes.value],
        })
        const res = await user.approveAndActivateEmail("test@mail.com")
        if (!res.isError()) {
          throw new Error(`must be error`)
        }
        expect(res.error).toEqual(EmailAlreadyApprovedErr)
      })
    })
  })
})
