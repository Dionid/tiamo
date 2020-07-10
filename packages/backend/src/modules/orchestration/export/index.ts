import { EventBusProvider } from "@dddl/core/dist/eda"
import { UserRegistered } from "../../authN/application/events"
import { OnUserRegistered } from "../application/on-widget-question"

export function initOrchestratorService(
  syncEventBusProvider: EventBusProvider,
  asyncEventBusProvider: EventBusProvider,
): void {
  asyncEventBusProvider.subscribe(UserRegistered, OnUserRegistered)
}
