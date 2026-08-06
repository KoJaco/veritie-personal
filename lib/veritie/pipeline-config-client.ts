import type { VeritieSDK } from "@veritie/sdk/client";

/** Minimal Veritie client surface for server-side pipeline config fetch. */
export type VeritiePipelineConfigClient = Pick<
    VeritieSDK,
    "getPipelineConfig"
>;
