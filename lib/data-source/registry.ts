import { backendDataSourceAdapters } from "./backend-adapter";
import { stubDataSourceAdapters } from "./stub-adapter";
import type { DataSourceAdapters, DataSourceKind } from "./types";

const DATA_SOURCE_ENV_KEY = "PLATFORM_SHELL_FE_DATA_SOURCE";

export function getDataSourceKind(
    envValue = process.env[DATA_SOURCE_ENV_KEY],
): DataSourceKind {
    if (envValue === "backend") return "backend";
    return "stub";
}

export function getDataSourceAdapters(
    kind: DataSourceKind = getDataSourceKind(),
): DataSourceAdapters {
    if (kind === "backend") {
        return backendDataSourceAdapters;
    }
    return stubDataSourceAdapters;
}

export { DATA_SOURCE_ENV_KEY };
