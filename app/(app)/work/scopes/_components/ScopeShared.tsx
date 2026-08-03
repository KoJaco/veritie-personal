import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SURFACE_CLASS } from "@/lib/ui/surface";

export type ScopeNavLink = {
    href: string;
    label: string;
};

export function ScopeQuickNav({ links }: { links: ScopeNavLink[] }) {
    return (
        <div className={`${SURFACE_CLASS} p-4`}>
            <p className="mb-3 text-sm text-muted-foreground">
                Quick navigation
            </p>
            <div className="flex flex-wrap gap-2">
                {links.map((link) => (
                    <Button key={link.href} asChild variant="outline" size="sm">
                        <Link href={link.href}>{link.label}</Link>
                    </Button>
                ))}
            </div>
        </div>
    );
}

export function ScopeSection({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-base font-semibold text-foreground">
                    {title}
                </h2>
                {description ? (
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

export function PlaceholderStatGrid({
    columnsClassName,
    items,
}: {
    columnsClassName: string;
    items: string[];
}) {
    return (
        <div className={`grid gap-3 ${columnsClassName}`}>
            {items.map((label) => (
                <div key={label} className={`${SURFACE_CLASS} p-4`}>
                    <p className="text-2xl font-semibold tracking-tight">--</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {label}
                    </p>
                </div>
            ))}
        </div>
    );
}

export const SCOPE_GLOBAL_NAV_LINKS: ScopeNavLink[] = [
    { href: "/work/scopes", label: "All scopes" },
    { href: "/work/scopes/operations-readiness", label: "Operations Readiness" },
    { href: "/work/scopes/delivery-observability", label: "Delivery Observability" },
    { href: "/work/scopes/workspace-resilience", label: "Workspace Resilience" },
    { href: "/work/scopes/knowledge-hygiene", label: "Knowledge Hygiene" },
];
