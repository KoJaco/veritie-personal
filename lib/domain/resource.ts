import type { AspectKey } from "./aspect";

export type ResourceCategory =
    | "person"
    | "provider"
    | "account"
    | "service"
    | "subscription"
    | "place"
    | "project"
    | "property"
    | "vehicle"
    | "device";

export interface Resource {
    id: string;
    name: string;
    category: ResourceCategory;
    summary?: string;
    aspectIds: AspectKey[];
    sourceCaptureIds: string[];
    sourceValueIds: string[];
    createdAt: string;
    updatedAt: string;
}
