import { EitherResultP, Result } from "@dddl/core/dist/rop"
import * as Mailgun from "mailgun-js"
import { LOGGER_DI_TOKEN, Logger } from "@dddl/core/dist/logger"
import { Inject } from "typedi"

export class MailgunNotificationSender {
  constructor(
    protected client: Mailgun.Mailgun,
    @Inject(LOGGER_DI_TOKEN) protected logger: Logger,
  ) {}

  async sendRegistrationApprovalMail(userEmail: string, token: string): EitherResultP {
    const data = {
      from: "Excited User <me@samples.mailgun.org>",
      to: `${userEmail}`,
      subject: "Email verification",
      text: `Hi there! We are trying to verify your email ${userEmail}. Get your token: ${token}!`,
    }
    try {
      const res = await this.client.messages().send(data)
      this.logger.info(res)
    } catch (e) {
      return Result.error(e)
    }
    return Result.oku()
  }
}
