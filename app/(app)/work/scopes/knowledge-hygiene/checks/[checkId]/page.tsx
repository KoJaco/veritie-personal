import { getDataSourceAdapters } from "@/lib/data-source";
import {
    getLensFromSearchParams,
    normalizeLens,
    type SearchParamRecord,
} from "@/lib/lens";
import { ScopeCheckDetailPage } from "../../../_components/CheckDetailPage";
import { buildCheckRouteContract } from "../../../_check-page-model/build";
import { enforceCheckRouteContract } from "../../../_check-page-model/validate";

interface KnowledgeHygieneCheckDetailPageProps {
    params: Promise<{ checkId: string }>;
    searchParams: Promise<SearchParamRecord>;
}

export default async function KnowledgeHygieneCheckDetailPage({
    params,
    searchParams,
}: KnowledgeHygieneCheckDetailPageProps) {
    const dataSource = getDataSourceAdapters();
    const { checkId } = await params;
    const lens = getLensFromSearchParams(await searchParams);
    const normalizedLens =
        lens.scope === "knowledge-hygiene"
            ? lens
            : normalizeLens({ scope: "knowledge-hygiene" });
    const checkScope = { scopeId: "knowledge-hygiene" as const };
    const check = dataSource.checks.getCheckDetail(
        checkScope,
        checkId,
    );
    const contract = buildCheckRouteContract({
        lens: normalizedLens,
        checkScope,
        check,
    });
    const { payload } = enforceCheckRouteContract(contract);

    return (
        <ScopeCheckDetailPage
            title={check.title}
            lens={normalizedLens}
            check={check}
            payload={payload}
            checkScope={checkScope}
        />
    );
}
