import { type LoaderFunctionArgs, useLoaderData, redirect } from "react-router";
import { ProgressiveRoutePanel } from "~/components/ui/progressive-route-panel";
import { Skeleton } from "~/components/ui/skeleton";
import type { RouteLoaderData } from "~/lib/progressive-loading";
import type {
    DashboardAccountOverviewCriticalData,
    DashboardAccountOverviewPrimaryPanelData,
} from "~/lib/dashboard/dashboard-account-overview.server";
import { SURFACE_CLASS } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const { requireUser } = await import("~/lib/auth/auth.server");
    const { hasPermission } = await import("~/lib/permissions.server");
    const {
        getDashboardAccountOverviewCriticalData,
        getDashboardAccountOverviewPrimaryPanelData,
    } = await import("~/lib/dashboard/dashboard-account-overview.server");
    const { appUser } = await requireUser(request);

    // Check if user has permission to view account details
    const canViewAccount = await hasPermission(
        appUser.id,
        "account",
        "retrieve",
    );

    // TODO: is this the best flow?

    // If user doesn't have permission, redirect to user settings
    if (!canViewAccount) {
        throw redirect("/dashboard/settings");
    }

    return {
        critical: await getDashboardAccountOverviewCriticalData(),
        deferred: {
            primary: streamPanel(
                getDashboardAccountOverviewPrimaryPanelData(appUser.accountId),
            ),
        },
    };
}

type AccountOverviewRouteLoaderData = RouteLoaderData<
    DashboardAccountOverviewCriticalData,
    DashboardAccountOverviewPrimaryPanelData
>;

const AccountOverviewPage = () => {
    const { deferred } =
        useLoaderData<typeof loader>() as AccountOverviewRouteLoaderData;

    return (
        <div className="w-full">
            <div className="mb-6">
                <h2 className="text-2xl font-medium">Account Overview</h2>
                <p className="text-sm text-muted-foreground">
                    Checkout all your account information here.
                </p>
            </div>

            <ProgressiveRoutePanel
                resolve={deferred.primary}
                fallback={<AccountOverviewSkeleton />}
                errorTitle="Account overview unavailable"
            >
                {(primary) => <AccountOverviewPanel account={primary.account} />}
            </ProgressiveRoutePanel>
        </div>
    );
};

export default AccountOverviewPage;

function AccountOverviewPanel({
    account,
}: {
    account: DashboardAccountOverviewPrimaryPanelData["account"];
}) {
    return (
        <div className={cn(SURFACE_CLASS)}>
            <div className="space-y-3">
                <div>
                    <h3 className="block text-sm font-medium text-foreground/90">
                        Account ID
                    </h3>
                    <p className="mt-1 text-sm text-foreground/50">
                        {account.id}
                    </p>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-foreground/90">
                        Account Name
                    </h3>
                    <p className="mt-1 text-sm text-foreground/50">
                        {account.name}
                    </p>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-foreground/90">
                        Account Created
                    </h3>
                    <p className="mt-1 text-sm text-foreground/50">
                        {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-foreground/90">
                        Last Updated
                    </h3>
                    <p className="mt-1 text-sm text-foreground/50">
                        {new Date(account.updatedAt).toLocaleDateString()}
                    </p>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-foreground/90">
                        Plan
                    </h3>
                    <p className="mt-1 text-sm text-foreground/50">
                        {account.plan}
                    </p>
                </div>
            </div>
        </div>
    );
}

function AccountOverviewSkeleton() {
    return (
        <div className={cn(SURFACE_CLASS)}>
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function streamPanel<T>(promise: Promise<T>) {
    return promise;
}
