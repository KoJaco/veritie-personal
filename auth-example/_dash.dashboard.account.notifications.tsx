/**
 * Notifications Page
 *
 * Table-based view of all notifications with filtering and sorting.
 */

import {
    type LoaderFunctionArgs,
    type ActionFunctionArgs,
    useLoaderData,
    Form,
    Link,
    useNavigation,
} from "react-router";

import { CardContent } from "~/components/ui/card";
import { ProgressiveRoutePanel } from "~/components/ui/progressive-route-panel";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Check, X, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import type { RouteLoaderData } from "~/lib/progressive-loading";
import type {
    DashboardNotificationsCriticalData,
    DashboardNotificationsPrimaryPanelData,
} from "~/lib/dashboard/dashboard-notifications.server";
import { SURFACE_CLASS, SURFACE_CLASS_NESTED } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    const { initRequestContext, withRequestContext } =
        await import("~/lib/request-context.server");
    const { requireUser } = await import("~/lib/auth/auth.server");
    const { createErrorResponse } = await import("~/lib/errors.server");
    const {
        getDashboardNotificationsCriticalData,
        getDashboardNotificationsPrimaryPanelData,
    } = await import("~/lib/dashboard/dashboard-notifications.server");
    const context = initRequestContext(request);

    return withRequestContext(context, async () => {
        try {
            const { appUser } = await requireUser(request);
            const critical = getDashboardNotificationsCriticalData(request.url);

            return {
                critical,
                deferred: {
                    primary: streamPanel(
                        getDashboardNotificationsPrimaryPanelData({
                            accountId: appUser.accountId,
                            userId: appUser.id,
                            filters: critical.filters,
                        }),
                    ),
                },
            };
        } catch (error) {
            return createErrorResponse(
                error,
                "Failed to load notifications",
                500,
            );
        }
    });
}

type NotificationsRouteLoaderData = RouteLoaderData<
    DashboardNotificationsCriticalData,
    DashboardNotificationsPrimaryPanelData
>;

export async function action({ request }: ActionFunctionArgs) {
    const { initRequestContext, withRequestContext } =
        await import("~/lib/request-context.server");
    const { requireUser } = await import("~/lib/auth/auth.server");
    const { createErrorResponse } = await import("~/lib/errors.server");
    const context = initRequestContext(request);

    return withRequestContext(context, async () => {
        try {
            const { appUser } = await requireUser(request);
            const formData = await request.formData();
            const intent = formData.get("intent");

            if (intent === "mark-all-read") {
                const { markAllNotificationsRead } =
                    await import("~/lib/notifications/server");
                await markAllNotificationsRead(appUser.accountId, appUser.id);
                return { success: true };
            }

            if (intent === "mark-read") {
                const notificationId = formData.get("notificationId");
                if (!notificationId || typeof notificationId !== "string") {
                    return createErrorResponse(
                        new Error("Notification ID is required"),
                        "Notification ID is required",
                        400,
                    );
                }

                const { markNotificationRead } =
                    await import("~/lib/notifications/server");
                await markNotificationRead(
                    notificationId,
                    appUser.id,
                    appUser.accountId,
                );
                return { success: true };
            }

            if (intent === "mark-unread") {
                const notificationId = formData.get("notificationId");
                if (!notificationId || typeof notificationId !== "string") {
                    return createErrorResponse(
                        new Error("Notification ID is required"),
                        "Notification ID is required",
                        400,
                    );
                }

                const { markNotificationUnread } =
                    await import("~/lib/notifications/server");
                await markNotificationUnread(
                    notificationId,
                    appUser.id,
                    appUser.accountId,
                );
                return { success: true };
            }

            return { success: false };
        } catch (error) {
            return createErrorResponse(error, "Failed to process action", 500);
        }
    });
}

const typeColors = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
    critical: "bg-red-600",
};

export default function NotificationsPage() {
    const { critical, deferred } =
        useLoaderData<typeof loader>() as NotificationsRouteLoaderData;
    const navigation = useNavigation();
    const [readFilter, setReadFilter] = useState(
        critical.filters.read || "all",
    );
    const [typeFilter, setTypeFilter] = useState(
        critical.filters.type || "all",
    );
    const [sortBy, setSortBy] = useState(
        critical.filters.sortBy || "createdAt",
    );
    const [sortOrder, setSortOrder] = useState(
        critical.filters.sortOrder || "desc",
    );

    // Refresh page after actions
    useEffect(() => {
        if (navigation.state === "idle" && navigation.formMethod === "POST") {
            window.location.reload();
        }
    }, [navigation.state, navigation.formMethod]);

    const buildUrl = (params: Record<string, string>) => {
        const searchParams = new URLSearchParams();
        if (params.read && params.read !== "all")
            searchParams.set("read", params.read);
        if (params.type && params.type !== "all")
            searchParams.set("type", params.type);
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
        return `/dashboard/account/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    };

    return (
        <div className="w-full space-y-6 mt-12 md:mt-0">
            <div>
                <div>
                    <h3 className="text-2xl font-medium">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your account notifications
                    </p>
                </div>
            </div>

            <div className={cn(SURFACE_CLASS)}>
                <CardContent className="space-y-6 p-0">
                    {/* Filters Section */}
                    <div className="space-y-3">
                        <div>
                            <h4 className="text-md font-semibold mb-4">
                                Filters
                            </h4>
                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={readFilter}
                                    onValueChange={(value) => {
                                        setReadFilter(value);
                                        window.location.href = buildUrl({
                                            read: value,
                                            type: typeFilter,
                                            sortBy,
                                            sortOrder,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Filter by read" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">
                                            Read
                                        </SelectItem>
                                        <SelectItem value="false">
                                            Unread
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={typeFilter}
                                    onValueChange={(value) => {
                                        setTypeFilter(value);
                                        window.location.href = buildUrl({
                                            read: readFilter,
                                            type: value,
                                            sortBy,
                                            sortOrder,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Types
                                        </SelectItem>
                                        <SelectItem value="info">
                                            Info
                                        </SelectItem>
                                        <SelectItem value="success">
                                            Success
                                        </SelectItem>
                                        <SelectItem value="warning">
                                            Warning
                                        </SelectItem>
                                        <SelectItem value="error">
                                            Error
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            Critical
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={`${sortBy}-${sortOrder}`}
                                    onValueChange={(value) => {
                                        const [newSortBy, newSortOrder] =
                                            value.split("-");
                                        setSortBy(newSortBy);
                                        setSortOrder(newSortOrder);
                                        window.location.href = buildUrl({
                                            read: readFilter,
                                            type: typeFilter,
                                            sortBy: newSortBy,
                                            sortOrder: newSortOrder,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="createdAt-desc">
                                            Newest First
                                        </SelectItem>
                                        <SelectItem value="createdAt-asc">
                                            Oldest First
                                        </SelectItem>
                                        <SelectItem value="readAt-desc">
                                            Recently Read
                                        </SelectItem>
                                        <SelectItem value="readAt-asc">
                                            Oldest Read
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="opacity-20" />

                    <ProgressiveRoutePanel
                        resolve={deferred.primary}
                        fallback={<NotificationsResultsSkeleton />}
                        errorTitle="Notifications unavailable"
                    >
                        {(primary) => (
                            <NotificationsResultsPanel primary={primary} />
                        )}
                    </ProgressiveRoutePanel>
                </CardContent>
            </div>
        </div>
    );
}

function NotificationsResultsPanel({
    primary,
}: {
    primary: DashboardNotificationsPrimaryPanelData;
}) {
    return (
        <>
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h4 className="text-md font-semibold mb-4">
                            All Notifications ({primary.notifications.length})
                        </h4>
                    </div>
                    {primary.unreadCount > 0 ? (
                        <Form method="post">
                            <input
                                type="hidden"
                                name="intent"
                                value="mark-all-read"
                            />
                            <Button type="submit" variant="outline" size="sm">
                                Mark all as read
                            </Button>
                        </Form>
                    ) : null}
                </div>
            </div>
            {primary.notifications.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-muted-foreground">
                        No notifications found
                    </p>
                </div>
            ) : (
                <div
                    className={cn(
                        SURFACE_CLASS_NESTED,
                        "sm:p-3 p-1.5 overflow-hidden",
                    )}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Type</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Message</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-[100px]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {primary.notifications.map((notification) => (
                                <TableRow
                                    key={notification.id}
                                    className={
                                        notification.read ? "opacity-60" : ""
                                    }
                                >
                                    <TableCell>
                                        <div
                                            className={`h-3 w-3 rounded-full ${typeColors[notification.type]}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium max-w-60 whitespace-normal">
                                        {notification.title}
                                    </TableCell>
                                    <TableCell className="max-w-80 whitespace-normal text-foreground/50">
                                        {notification.message}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                notification.read
                                                    ? "secondary"
                                                    : "default"
                                            }
                                        >
                                            {notification.read
                                                ? "Read"
                                                : "Unread"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(
                                            notification.createdAt,
                                        ).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {notification.actionUrl ? (
                                                <Link
                                                    to={notification.actionUrl}
                                                    className="p-1 hover:bg-muted rounded"
                                                    title="View"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Link>
                                            ) : null}
                                            <Form method="post">
                                                <input
                                                    type="hidden"
                                                    name="intent"
                                                    value={
                                                        notification.read
                                                            ? "mark-unread"
                                                            : "mark-read"
                                                    }
                                                />
                                                <input
                                                    type="hidden"
                                                    name="notificationId"
                                                    value={notification.id}
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title={
                                                        notification.read
                                                            ? "Mark as unread"
                                                            : "Mark as read"
                                                    }
                                                >
                                                    {notification.read ? (
                                                        <X className="h-4 w-4" />
                                                    ) : (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </Form>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </>
    );
}

function NotificationsResultsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-9 w-28 rounded-md" />
            </div>
            <div
                className={cn(
                    SURFACE_CLASS_NESTED,
                    "sm:p-3 p-1.5 overflow-hidden",
                )}
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-[0.4fr_1.2fr_1.6fr_0.8fr_1fr_0.8fr] gap-3 px-3 py-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="h-4 w-full" />
                        ))}
                    </div>
                    {Array.from({ length: 5 }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid grid-cols-[0.4fr_1.2fr_1.6fr_0.8fr_1fr_0.8fr] gap-3 px-3 py-3"
                        >
                            <Skeleton className="h-3 w-3 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-md" />
                                <Skeleton className="h-8 w-8 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function streamPanel<T>(promise: Promise<T>) {
    return promise;
}
