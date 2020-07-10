import { ValueObject } from "@dddl/core/dist/domain"
import * as Joi from "@hapi/joi"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { InvalidDataErr, PublicErr } from "@dddl/core/dist/errors"
import { v4 } from "uuid"

export enum EmailStatus {
  "activating" = "activating",
  "activated" = "activated",
  "deactivating" = "deactivating",
  "deactivated" = "deactivated",
}

export type EmailProps = {
  createdAt: Date
  updatedAt: Date
  value: string
  status: EmailStatus
  approved: boolean
  token: string
}

export class Email extends ValueObject<EmailProps> {
  public static async __createByRepository(props: EmailProps): EitherResultP<Email> {
    if (!props.token) {
      props.token = v4()
    }
    return Result.ok(new Email(props))
  }

  public static async create(props: {
    value: string
    status: EmailStatus
    approved: boolean
    token: string
  }): EitherResultP<Email, Error[]> {
    const errors: Error[] = []
    const emErr = Joi.string().email().validate(props.value)
    if (emErr.error) {
      errors.push(new InvalidDataErr("Email is incorrect!"))
    }
    if (props.status === EmailStatus.activated) {
      if (!props.approved) {
        errors.push(new InvalidDataErr("Email must be approved to be activated"))
      }
    }
    const tokenErr = Joi.string().uuid().required().validate(props.token)
    if (tokenErr.error) {
      errors.push(new InvalidDataErr(`Token is not uuid or empty!`))
    }
    if (errors.length) {
      return Result.error(errors)
    }
    const email = new Email({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return Result.ok(email)
  }

  async approve(): EitherResultP<Email> {
    return Email.create({
      ...this.props,
      approved: true,
    })
  }

  async activate(): EitherResultP<Email> {
    return Email.create({
      ...this.props,
      status: EmailStatus.activated,
    })
  }
}
