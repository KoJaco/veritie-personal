import {
    data,
    Form,
    useLoaderData,
    type LoaderFunctionArgs,
} from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ProgressiveRoutePanel } from "~/components/ui/progressive-route-panel";
import { Skeleton } from "~/components/ui/skeleton";
import type { RouteLoaderData } from "~/lib/progressive-loading";
import { SURFACE_CLASS } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";
import {
    BILLING_PLANS,
    BYTES_PER_GB,
    type BillingPlanId,
    type BillingPlanDefinition,
} from "~/lib/billing/config";
import type {
    DashboardBillingCriticalData,
    DashboardBillingPrimaryPanelData,
    DashboardBillingSecondaryPanelData,
} from "~/lib/dashboard/dashboard-billings.server";

const TEAM_PLAN_COMING_SOON = true;

export async function loader({ request }: LoaderFunctionArgs) {
    const { requirePermission } = await import("~/lib/permissions.server");
    const { getCsrfTokenWithHeaders } = await import("~/lib/csrf.server");
    const {
        getDashboardBillingCriticalData,
        getDashboardBillingPrimaryPanelData,
    } = await import("~/lib/dashboard/dashboard-billings.server");
    const { appUser } = await requirePermission(request, "billing", "retrieve");
    const { token: csrfToken, headers } =
        await getCsrfTokenWithHeaders(request);
    const snapshotPromise = getDashboardBillingPrimaryPanelData(
        appUser.accountId,
    );

    return data(
        {
            critical: getDashboardBillingCriticalData({
                appUserRole: appUser.role,
                csrfToken,
            }),
            deferred: {
                primary: streamPanel(snapshotPromise),
                secondary: streamPanel(snapshotPromise),
            },
        },
        { headers },
    );
}

type BillingPageLoaderData = RouteLoaderData<
    DashboardBillingCriticalData,
    DashboardBillingPrimaryPanelData,
    DashboardBillingSecondaryPanelData
>;

function formatStorage(bytes: number): string {
    if (bytes >= BYTES_PER_GB) {
        return `${(bytes / BYTES_PER_GB).toFixed(bytes % BYTES_PER_GB === 0 ? 0 : 1)} GB`;
    }

    return `${Math.ceil(bytes / (1024 * 1024))} MB`;
}

function getUsagePercent(used: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
}

function formatMinutes(minutes: number): string {
    return `${minutes} min`;
}

function getStorageMessage(snapshot: DashboardBillingPrimaryPanelData) {
    const planName = BILLING_PLANS[snapshot.entitlements.plan].name;
    const used = formatStorage(snapshot.usage.storageUsedBytes);
    const included = formatStorage(snapshot.entitlements.storageIncludedBytes);

    if (snapshot.storageState === "blocked") {
        return snapshot.entitlements.plan === "free"
            ? "You’ve reached the 1 GB storage limit on Free. Upgrade to Solo for more storage, or delete unused media to continue uploading."
            : `You’ve reached your ${planName} storage limit. Delete unused media or change plans before uploading more files.`;
    }

    if (snapshot.storageState === "grace") {
        return `You’re over the included ${planName} storage allowance. You can still work, but the next upload block is approaching.`;
    }

    if (snapshot.storageState === "warning") {
        return `You’ve used ${used} of ${included}.`;
    }

    return `You’re using ${used} of ${included}.`;
}

function BillingPlanCard({
    plan,
    currentPlan,
    stripeConfigured,
    canManageBilling,
    canUpdateBilling,
    csrfToken,
}: {
    plan: BillingPlanDefinition;
    currentPlan: string;
    stripeConfigured: boolean;
    canManageBilling: boolean;
    canUpdateBilling: boolean;
    csrfToken: string;
}) {
    const isCurrentPlan = currentPlan === plan.id;
    const isPaidPlan = plan.id !== "free";
    const isTeamPlan = plan.id === "team";
    const isTeamComingSoon = isTeamPlan && TEAM_PLAN_COMING_SOON;
    const canSubmitCheckout =
        stripeConfigured &&
        canUpdateBilling &&
        isPaidPlan &&
        currentPlan !== "team" &&
        !isTeamComingSoon;

    return (
        <div
            className={cn(
                SURFACE_CLASS,
                "border-border/60 rounded-2xl h-full",
                isCurrentPlan && "ring-2 ring-inset-2 ring-primary/60",
            )}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            {plan.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isTeamComingSoon ? (
                            <span className="text-xs uppercase tracking-[0.14em] text-amber-700">
                                Coming soon
                            </span>
                        ) : null}
                        {isCurrentPlan ? (
                            <span className="text-xs uppercase tracking-[0.14em] text-primary">
                                Current
                            </span>
                        ) : null}
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-semibold">
                        {plan.priceLabel}
                        <span className="text-base font-normal text-muted-foreground">
                            {plan.cadenceLabel}
                        </span>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <ul className="space-y-3 text-sm text-foreground/80">
                    {plan.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                    ))}
                </ul>

                {isCurrentPlan ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full"
                    >
                        Current plan
                    </Button>
                ) : isTeamComingSoon ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full"
                    >
                        Team coming soon
                    </Button>
                ) : canSubmitCheckout ? (
                    <Form
                        action="/api/billing/checkout"
                        method="post"
                        className="w-full"
                    >
                        <input
                            type="hidden"
                            name="csrf_token"
                            value={csrfToken}
                        />
                        <input type="hidden" name="plan" value={plan.id} />
                        <Button type="submit" className="w-full">
                            {currentPlan === "free"
                                ? `Upgrade to ${plan.name}`
                                : `Switch to ${plan.name}`}
                        </Button>
                    </Form>
                ) : isPaidPlan && !stripeConfigured ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full"
                    >
                        Stripe not configured
                    </Button>
                ) : canManageBilling ? (
                    <Form
                        action="/api/billing/portal"
                        method="post"
                        className="w-full"
                    >
                        <input
                            type="hidden"
                            name="csrf_token"
                            value={csrfToken}
                        />
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full"
                        >
                            Manage in billing portal
                        </Button>
                    </Form>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="w-full"
                    >
                        Unavailable
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function BillingPage() {
    const { critical, deferred } = useLoaderData<
        typeof loader
    >() as BillingPageLoaderData;

    return (
        <div className="w-full space-y-6 mt-12 md:mt-0">
            <div className="space-y-2">
                <h3 className="text-2xl font-medium">Billing & Usage</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your plan, storage, seats, share links, and voice
                    logs here.
                </p>
            </div>

            {!critical.stripeConfigured ? (
                <div className={cn(SURFACE_CLASS, "border-amber-500/30")}>
                    <CardContent className="pt-6 space-y-2">
                        <p className="font-medium text-foreground">
                            Stripe billing is not fully configured.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Missing environment variables:{" "}
                            {critical.missingStripeConfig.join(", ")}
                        </p>
                    </CardContent>
                </div>
            ) : null}

            <ProgressiveRoutePanel
                resolve={deferred.primary}
                fallback={<BillingPrimaryPanelSkeleton />}
                errorTitle="Billing usage unavailable"
            >
                {(snapshot) => (
                    <BillingPrimaryPanel
                        snapshot={snapshot}
                        critical={critical}
                    />
                )}
            </ProgressiveRoutePanel>

            <ProgressiveRoutePanel
                resolve={deferred.secondary}
                fallback={<BillingPlansPanelSkeleton />}
                errorTitle="Billing plans unavailable"
            >
                {(snapshot) => (
                    <BillingPlansPanel
                        snapshot={snapshot}
                        critical={critical}
                    />
                )}
            </ProgressiveRoutePanel>
        </div>
    );
}

function BillingPrimaryPanel({
    snapshot,
    critical,
}: {
    snapshot: DashboardBillingPrimaryPanelData;
    critical: DashboardBillingCriticalData;
}) {
    const viewModel = getBillingViewModel(snapshot, critical.appUserRole);

    return (
        <>
            <div className={cn(SURFACE_CLASS, "rounded-2xl")}>
                <div className="space-y-3">
                    <div className="text-xl">
                        {viewModel.currentPlanDefinition.name}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Status:{" "}
                        <span className="capitalize">
                            {snapshot.account.subscriptionStatus ?? "free"}
                        </span>
                        {snapshot.account.cancelAtPeriodEnd &&
                        snapshot.account.currentPeriodEnd
                            ? `, cancels at period end (${new Date(snapshot.account.currentPeriodEnd).toLocaleDateString("en-AU")})`
                            : ""}
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    <UsageCard
                        label="Storage"
                        value={`${formatStorage(snapshot.usage.storageUsedBytes)} / ${formatStorage(snapshot.entitlements.storageIncludedBytes)}`}
                        percent={viewModel.storagePercent}
                        message={getStorageMessage(snapshot)}
                    />
                    <UsageCard
                        label="Seats"
                        value={`${snapshot.usage.activeUsers} / ${snapshot.entitlements.seatLimit}`}
                        percent={viewModel.seatPercent}
                        message={
                            viewModel.currentPlan === "team"
                                ? `${snapshot.usage.pendingInvitations} pending invite${snapshot.usage.pendingInvitations === 1 ? "" : "s"}`
                                : "Team collaboration unlocks on Team."
                        }
                    />
                    <UsageCard
                        label="Open jobs"
                        value={
                            snapshot.entitlements.freeJobLimit === null
                                ? `${snapshot.usage.countableJobs} active`
                                : `${snapshot.usage.countableJobs} / ${snapshot.entitlements.freeJobLimit}`
                        }
                        percent={viewModel.freeJobPercent}
                        message={
                            snapshot.entitlements.freeJobLimit === null
                                ? "Paid plans do not have a job cap."
                                : "Draft and active jobs count against the Free limit."
                        }
                    />
                    <UsageCard
                        label="Share links"
                        value={
                            snapshot.entitlements.freeShareLinkLimit === null
                                ? `${snapshot.usage.activeShareLinks} active`
                                : `${snapshot.usage.activeShareLinks} / ${snapshot.entitlements.freeShareLinkLimit}`
                        }
                        percent={viewModel.shareLinkPercent}
                        message={
                            snapshot.entitlements.freeShareLinkLimit === null
                                ? "Paid plans include unlimited public links."
                                : "Free accounts can keep 3 active public links at a time."
                        }
                    />
                    <UsageCard
                        label="Voice logs"
                        value={`${formatMinutes(snapshot.usage.voiceLogMonthlyMinutesUsed)} / ${formatMinutes(snapshot.entitlements.voiceLogMonthlyMinutes)}`}
                        percent={viewModel.voiceLogPercent}
                        message={
                            snapshot.entitlements
                                .voiceLogAllowedPipelinePolicy ===
                            "transcript_only"
                                ? "Transcript-only voice logs are available on Free."
                                : "Monthly allowance resets at the start of each UTC month."
                        }
                    />
                    <UsageCard
                        label="Generations"
                        value={
                            snapshot.entitlements.generationMonthlyLimit <= 0
                                ? `${snapshot.usage.generationMonthlyUsed} used`
                                : `${snapshot.usage.generationMonthlyUsed} / ${snapshot.entitlements.generationMonthlyLimit}`
                        }
                        percent={viewModel.generationPercent}
                        message={
                            snapshot.entitlements.generationMonthlyLimit <= 0
                                ? "Upgrade to Solo or Team for AI generations."
                                : "Each successful preview counts as one generation. Resets at the start of each UTC month."
                        }
                    />
                </div>
                {viewModel.canManagePaidPlan ? (
                    <div className="flex justify-end mt-6">
                        <Form action="/api/billing/portal" method="post">
                            <input
                                type="hidden"
                                name="csrf_token"
                                value={critical.csrfToken}
                            />
                            <Button type="submit" variant="outline">
                                Manage billing
                            </Button>
                        </Form>
                    </div>
                ) : null}
            </div>

            {viewModel.canManageSeats ? (
                <Card className={cn(SURFACE_CLASS, "rounded-2xl")}>
                    <CardHeader>
                        <CardTitle className="text-lg">Team seats</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-foreground/80">
                                Current seats: {snapshot.entitlements.seatLimit}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Extra seats are billed at $
                                {(critical.extraSeatPriceCents / 100).toFixed(
                                    0,
                                )}{" "}
                                AUD/month each.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Form action="/api/billing/seats" method="post">
                                <input
                                    type="hidden"
                                    name="csrf_token"
                                    value={critical.csrfToken}
                                />
                                <input
                                    type="hidden"
                                    name="totalSeats"
                                    value={viewModel.nextLowerSeatLimit}
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={
                                        snapshot.entitlements.seatLimit <=
                                        viewModel.minSeats
                                    }
                                >
                                    Remove seat
                                </Button>
                            </Form>
                            <Form action="/api/billing/seats" method="post">
                                <input
                                    type="hidden"
                                    name="csrf_token"
                                    value={critical.csrfToken}
                                />
                                <input
                                    type="hidden"
                                    name="totalSeats"
                                    value={snapshot.entitlements.seatLimit + 1}
                                />
                                <Button type="submit">Add seat</Button>
                            </Form>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </>
    );
}

function BillingPlansPanel({
    snapshot,
    critical,
}: {
    snapshot: DashboardBillingSecondaryPanelData;
    critical: DashboardBillingCriticalData;
}) {
    const viewModel = getBillingViewModel(snapshot, critical.appUserRole);

    return (
        <div className="grid gap-4 xl:grid-cols-3">
            {critical.plans.map((plan) => (
                <BillingPlanCard
                    key={plan.id}
                    plan={plan}
                    currentPlan={viewModel.currentPlan}
                    stripeConfigured={critical.stripeConfigured}
                    canManageBilling={viewModel.canManagePaidPlan}
                    canUpdateBilling={viewModel.canUpdateBilling}
                    csrfToken={critical.csrfToken}
                />
            ))}
        </div>
    );
}

function UsageCard({
    label,
    value,
    percent,
    message,
}: {
    label: string;
    value: string;
    percent: number;
    message: string;
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
            </div>
            <div className="h-2 rounded-full bg-primary/10 overflow-hidden">
                <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground">{message}</p>
        </div>
    );
}

function BillingPrimaryPanelSkeleton() {
    return (
        <div className="space-y-6">
            <div className={cn(SURFACE_CLASS, "rounded-2xl")}>
                <div className="space-y-3">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                            <div className="flex items-center justify-between gap-4">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-2 w-full rounded-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32 rounded-md" />
            </div>
        </div>
    );
}

function BillingPlansPanelSkeleton() {
    return (
        <div className="grid gap-4 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className={cn(SURFACE_CLASS, "space-y-6 rounded-2xl")}
                >
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-8 w-28" />
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, bulletIndex) => (
                                <Skeleton
                                    key={bulletIndex}
                                    className="h-4 w-full"
                                />
                            ))}
                        </div>
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function getBillingViewModel(
    snapshot: DashboardBillingPrimaryPanelData,
    appUserRole: DashboardBillingCriticalData["appUserRole"],
) {
    const currentPlan: BillingPlanId = snapshot.entitlements.plan;
    const currentPlanDefinition = BILLING_PLANS[currentPlan];
    const storagePercent = getUsagePercent(
        snapshot.usage.storageUsedBytes,
        snapshot.entitlements.storageIncludedBytes,
    );
    const seatPercent = getUsagePercent(
        snapshot.usage.activeUsers,
        snapshot.entitlements.seatLimit,
    );
    const freeJobPercent =
        snapshot.entitlements.freeJobLimit === null
            ? 0
            : getUsagePercent(
                  snapshot.usage.countableJobs,
                  snapshot.entitlements.freeJobLimit,
              );
    const shareLinkPercent =
        snapshot.entitlements.freeShareLinkLimit === null
            ? 0
            : getUsagePercent(
                  snapshot.usage.activeShareLinks,
                  snapshot.entitlements.freeShareLinkLimit,
              );
    const voiceLogPercent = getUsagePercent(
        snapshot.usage.voiceLogMonthlyMinutesUsed,
        snapshot.entitlements.voiceLogMonthlyMinutes,
    );
    const generationPercent =
        snapshot.entitlements.generationMonthlyLimit <= 0
            ? 0
            : getUsagePercent(
                  snapshot.usage.generationMonthlyUsed,
                  snapshot.entitlements.generationMonthlyLimit,
              );
    const canUpdateBilling = appUserRole === "owner" || appUserRole === "admin";
    const canManagePaidPlan =
        currentPlan !== "free" &&
        Boolean(snapshot.account.stripeCustomerId) &&
        canUpdateBilling;
    const canManageSeats = currentPlan === "team" && canUpdateBilling;
    const minSeats = Math.max(
        currentPlanDefinition.includedSeats,
        snapshot.usage.activeUsers,
    );
    const nextLowerSeatLimit = Math.max(
        currentPlanDefinition.includedSeats,
        snapshot.entitlements.seatLimit - 1,
    );

    return {
        currentPlan,
        currentPlanDefinition,
        storagePercent,
        seatPercent,
        freeJobPercent,
        shareLinkPercent,
        voiceLogPercent,
        generationPercent,
        canUpdateBilling,
        canManagePaidPlan,
        canManageSeats,
        minSeats,
        nextLowerSeatLimit,
    };
}

function streamPanel<T>(promise: Promise<T>) {
    return promise;
}
