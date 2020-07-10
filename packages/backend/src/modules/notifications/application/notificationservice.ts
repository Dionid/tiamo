import { User } from "../../auth/domain/aggregates/user/user.aggregate"
import { EitherResultP } from "@dddl/rop"

export interface NotificationSender {
  sendRegistrationApprovalMail(userEmail: string, token: string): EitherResultP
}

export const NOTIFICATION_SENDER_DI_TOKEN = "NOTIFICATION_SENDER_DI_TOKEN"