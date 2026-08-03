export type EntityRef = {
    kind: string;
    id: string;
    summary?: string;
    title?: string;
    href?: string;
};

export type PageModelSection = {
    key: string;
    title?: string;
    kind: string;
    dataRef?: EntityRef | { kind: string; id: string };
    items?: Array<EntityRef | { kind: string; id: string; summary?: string }>;
};

export type PageModel = {
    meta: {
        title: string;
        description?: string;
        breadcrumbs: Array<{ label: string; href?: string }>;
        scope: { scopeId: string | "all" };
    };
    view: {
        key: string;
        featureFlags?: Record<string, boolean>;
    };
    refs?: {
        primary?: EntityRef;
        visible?: EntityRef[];
    };
    sections: PageModelSection[];
    capabilities: Record<string, boolean>;
    actions: {
        available: string[];
    };
};
