import { PageFrame } from "@/components/static/PageFrame";
import { ContextPayloadSlot } from "@/components/context/ContextPayloadSlot";
import { PageHeader } from "@/components/route";
import { getDataSourceAdapters } from "@/lib/data-source";
import { getLensFromSearchParams, type SearchParamRecord } from "@/lib/lens";
import { logger } from "@/lib/logging/server-logger";
import { SettingsPageContent } from "./_components/SettingsPageContent";
import { buildSettingsRouteContract } from "./_page-model/build";
import { enforceSettingsRouteContract } from "./_page-model/validate";

interface SettingsPageProps {
    searchParams: Promise<SearchParamRecord>;
}

export default async function SettingsPage({
    searchParams,
}: SettingsPageProps) {
    const lens = getLensFromSearchParams(await searchParams);
    const settings = getDataSourceAdapters().settings.getSettings();
    const contract = buildSettingsRouteContract({
        lens,
        settings,
    });
    const { pageModelValidation, payload } =
        enforceSettingsRouteContract(contract);

    logger.debug("[page-model] validation", {
        route: "/work/settings",
        ok: pageModelValidation.ok,
        sizeBytes: pageModelValidation.sizeBytes,
    });
    if (!pageModelValidation.ok) {
        logger.error("[page-model] validation_failed", {
            route: "/work/settings",
            errorCode: pageModelValidation.errorCode,
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes ?? null,
        });
    } else if (pageModelValidation.reason) {
        logger.warn("[page-model] payload_soft_limit_exceeded", {
            route: "/work/settings",
            reason: pageModelValidation.reason,
            sizeBytes: pageModelValidation.sizeBytes,
        });
    }

    return (
        <>
            <ContextPayloadSlot payload={payload} />
            <PageFrame
                header={<PageHeader title="Settings" separator={false} />}
            >
                <SettingsPageContent settings={settings} />
            </PageFrame>
        </>
    );
}
