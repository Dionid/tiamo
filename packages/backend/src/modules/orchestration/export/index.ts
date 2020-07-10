import { EventBusProvider } from "@dddl/core/dist/eda"
import {
  UserPasswordlessLoginedByToken,
  UserRegistered,
} from "../../authN/application/events"
import { OnUserRegisteredAsync } from "../application/on-widget-question"
import { OnUserPasswordlessLoginedByTokenSync } from "../application/on-user-passwordless-logined-by-token-sync"

export function initOrchestratorService(
  syncEventBusProvider: EventBusProvider,
  asyncEventBusProvider: EventBusProvider,
): void {
  // . Sync
  syncEventBusProvider.subscribe(
    UserPasswordlessLoginedByToken,
    OnUserPasswordlessLoginedByTokenSync,
  )
  // . Async
  asyncEventBusProvider.subscribe(UserRegistered, OnUserRegisteredAsync)
}
