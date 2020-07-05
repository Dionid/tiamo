import { ValueObject } from "@dddl/domain"
import * as Joi from "@hapi/joi"
import { EitherResultP, Result } from "@dddl/rop"
import { InvalidDataErr, PublicErr } from "@dddl/errors"
import { OmitAndModify } from "@dddl/common"
import {
  AuthUserEmail,
  AuthUserToken,
} from "applications/common/adapters/dal/schema/db-introspection"
import { v4 } from "uuid"

export enum EmailStatus {
  "activating" = "activating",
  "activated" = "activated",
  "deactivating" = "deactivating",
  "deactivated" = "deactivated",
}

export type EmailProps = OmitAndModify<
  AuthUserEmail,
  { userId: any },
  { status: EmailStatus }
>

export class Email extends ValueObject<EmailProps> {
  public static async create(props: {
    value: string
    status: EmailStatus
    approved: boolean
    id?: string
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
    if (errors.length) {
      return Result.error(errors)
    }
    const email = new Email({
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: props.id || v4(),
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
