import { z } from "zod";

import type { AppConfig } from "./app-config";

export const billingTierSchema = z.enum(["free", "paid"]);

export type BillingTier = z.infer<typeof billingTierSchema>;

export const usageUnitKindSchema = z.enum(["voice_log", "assistant_run"]);

export type UsageUnitKind = z.infer<typeof usageUnitKindSchema>;

export const usageUnitDefinitionSchema = z
    .object({
        kind: usageUnitKindSchema,
        label: z.string(),
        description: z.string(),
        /** Units consumed per event (voice_log = 1 per capture) */
        unitsPerEvent: z.number().int().positive(),
        /** Whether metering is active in the app */
        enabled: z.boolean(),
    })
    .strict();

export type UsageUnitDefinition = z.infer<typeof usageUnitDefinitionSchema>;

export const billingConfigSchema = z
    .object({
        tier: billingTierSchema,
        usageUnits: z.array(usageUnitDefinitionSchema),
    })
    .strict();

export type BillingConfig = z.infer<typeof billingConfigSchema>;

export const USAGE_UNIT_CATALOG: UsageUnitDefinition[] = [
    {
        kind: "voice_log",
        label: "Voice log",
        description: "One voice capture persisted counts as one unit.",
        unitsPerEvent: 1,
        enabled: true,
    },
    {
        kind: "assistant_run",
        label: "Assistant run",
        description: "Reserved for future AI assistant action metering.",
        unitsPerEvent: 1,
        enabled: false,
    },
];

export const DEFAULT_BILLING_CONFIG: BillingConfig = {
    tier: "free",
    usageUnits: USAGE_UNIT_CATALOG,
};

/** Documented usage_events.usage_type value for voice captures */
export const USAGE_EVENT_VOICE_LOG = "voice_log";

/** Reserved usage_events.usage_type for future assistant metering */
export const USAGE_EVENT_ASSISTANT_RUN = "assistant_run";

export function buildBillingConfig(tier: BillingTier = "free"): BillingConfig {
    return billingConfigSchema.parse({
        tier,
        usageUnits: USAGE_UNIT_CATALOG,
    });
}

export function parseBillingConfigFromSettings(
    settings: Record<string, unknown> | null | undefined,
): BillingConfig | null {
    if (!settings || typeof settings !== "object") {
        return null;
    }

    const raw = settings.billing;
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const parsed = billingConfigSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
}

export type AccountSettings = {
    appConfig?: AppConfig;
    billing?: BillingConfig;
};

export function buildAccountSettings(
    appConfig: AppConfig,
    billing: BillingConfig,
): AccountSettings {
    return {
        appConfig,
        billing,
    };
}
