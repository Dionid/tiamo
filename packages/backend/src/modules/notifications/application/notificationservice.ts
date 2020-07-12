import { EitherResultP } from "@dddl/core/dist/rop"

export interface NotificationSender {
  sendRegistrationApprovalMail(userEmail: string, token: string): EitherResultP
  sendPasswordlessAuthToken(userEmail: string, token: string): EitherResultP
}

export const NOTIFICATION_SENDER_DI_TOKEN = "NOTIFICATION_SENDER_DI_TOKEN"
