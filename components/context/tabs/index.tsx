import { AssistantTab } from "./AssistantTab";
import { ContextTab } from "./ContextTab";
import type { RailTabKey, RailContextPayload } from "../types";

export const TAB_COMPONENTS: Record<
    RailTabKey,
    React.ComponentType<{ context?: RailContextPayload }>
> = {
    assistant: AssistantTab,
    context: ContextTab,
};
