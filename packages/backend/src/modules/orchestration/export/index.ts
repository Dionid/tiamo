import { EventBusProvider } from "@dddl/eda"
import { UserRegistered } from "../../auth/application/events"
import { OnUserRegistered } from "../application/on-widget-question"

export function initOrchestratorService(
  syncEventBusProvider: EventBusProvider,
  asyncEventBusProvider: EventBusProvider,
): void {
  asyncEventBusProvider.subscribe(UserRegistered, OnUserRegistered)
}
