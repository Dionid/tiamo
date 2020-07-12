import { EventBusProvider } from "@dddl/core/dist/eda"
import {
  UserPasswordlessCodeByEmailRequested,
  UserRegistered,
} from "../../authN/application/events"
import { OnUserRegisteredAsync } from "../application/on-widget-question"
import { OnUserPasswordlessCodeByEmailRequestedSync } from "../application/on-user-passwordless-code-by-email-requested-sync"

export function initOrchestratorService(
  syncEventBusProvider: EventBusProvider,
  asyncEventBusProvider: EventBusProvider,
): void {
  // . Sync
  syncEventBusProvider.subscribe(
    UserPasswordlessCodeByEmailRequested,
    OnUserPasswordlessCodeByEmailRequestedSync,
  )
  // . Async
  asyncEventBusProvider.subscribe(UserRegistered, OnUserRegisteredAsync)
}
