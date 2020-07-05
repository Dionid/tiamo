import {User} from "./user.aggregate"
import {UserId} from "./user.id"
import {v4} from "uuid"

describe("User aggregate", function () {
  describe("with correct email", function () {
    it("should create new User", async function () {
      const res = await User.createByUser({id: new UserId(v4()), email: "test@mail.ru"})
      if (res.isError()) {
        throw res.error
      }
      expect(res.value).toBeInstanceOf(User)
      expect(res.value.domainEvents.length).toBe(1)
    })
  })

  describe("with incorrect email", function () {
    it("should return error", async function () {
      const res = await User.createByUser({id: new UserId(v4()), email: "blablabla"})
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
