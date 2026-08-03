import {
    Form,
    useActionData,
    useLoaderData,
    useNavigation,
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";

import { accounts, users } from "~/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ProgressiveRoutePanel } from "~/components/ui/progressive-route-panel";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "~/lib/hooks/use-toast";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "~/components/ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import {
    createServerClient,
    parseCookieHeader,
    serializeCookieHeader,
} from "@supabase/ssr";
import type { RouteLoaderData } from "~/lib/progressive-loading";
import type {
    DashboardAccountSettingsCriticalData,
    DashboardAccountSettingsPrimaryPanelData,
} from "~/lib/dashboard/dashboard-account-settings.server";
import { SURFACE_CLASS, SURFACE_CLASS_DANGER } from "~/lib/ui/surface";
import { cn } from "~/lib/utils";

const accountSettingsSchema = z.object({
    name: z.string().min(1, "Account name is required"),
});

const deleteAccountSchema = z.object({
    confirmation: z.literal("Delete this account"),
});

export async function loader({ request }: LoaderFunctionArgs) {
    const { requirePermission, hasPermission } =
        await import("~/lib/permissions.server");
    const {
        getDashboardAccountSettingsCriticalData,
        getDashboardAccountSettingsPrimaryPanelData,
    } = await import("~/lib/dashboard/dashboard-account-settings.server");
    const { appUser } = await requirePermission(request, "account", "retrieve");

    // Check if user has permission to delete account (must be owner and have delete permission)
    const canDeleteAccount =
        appUser.role === "owner" &&
        (await hasPermission(appUser.id, "account", "delete"));

    return {
        critical: getDashboardAccountSettingsCriticalData({
            canDeleteAccount,
        }),
        deferred: {
            primary: streamPanel(
                getDashboardAccountSettingsPrimaryPanelData(appUser.accountId),
            ),
        },
    };
}

type AccountSettingsRouteLoaderData = RouteLoaderData<
    DashboardAccountSettingsCriticalData,
    DashboardAccountSettingsPrimaryPanelData
>;

export async function action({ request }: ActionFunctionArgs) {
    const { db } = await import("~/lib/db/index.server");
    const { createActionErrorResponse } = await import("~/lib/errors.server");
    const { requirePermission } = await import("~/lib/permissions.server");
    const { publicConfig } = await import("~/lib/config.server");
    const { appUser } = await requirePermission(request, "account", "update");
    const formData = await request.formData();
    const intent = formData.get("intent");
    const data = Object.fromEntries(formData);
    const headers = new Headers();
    const cookieHeader = request.headers.get("Cookie");

    try {
        if (intent === "update") {
            const validatedData = accountSettingsSchema.parse(data);

            // Get account before update for audit log
            const accountBeforeUpdate = await db.query.accounts.findFirst({
                where: eq(accounts.id, appUser.accountId),
                columns: { name: true },
            });

            await db
                .update(accounts)
                .set({
                    name: validatedData.name,
                    updatedAt: new Date(),
                })
                .where(eq(accounts.id, appUser.accountId));

            // Log account update to audit logs
            if (accountBeforeUpdate) {
                try {
                    const { auditUserAction, createDiff } =
                        await import("~/lib/audit/server");
                    await auditUserAction(
                        appUser,
                        "account.updated",
                        "accounts",
                        appUser.accountId,
                        createDiff(
                            { name: accountBeforeUpdate.name },
                            { name: validatedData.name },
                        ),
                        {},
                    );
                } catch (auditError) {
                    // Log audit error but don't fail the operation
                    const { logger } = await import("~/lib/logging.server");
                    logger.error(
                        "Failed to create audit log for account update",
                        {
                            error: auditError,
                            accountId: appUser.accountId,
                        },
                    );
                }
            }

            return { success: true, intent: "update" };
        }

        if (intent === "delete_account") {
            try {
                const validatedData = deleteAccountSchema.parse(data);

                // Only owners can delete accounts
                if (appUser.role !== "owner") {
                    return {
                        ...createActionErrorResponse(
                            "Only account owners can delete accounts",
                            403,
                        ),
                        intent: "delete_account" as const,
                    };
                }

                // Get account details before deletion for audit log
                const accountBeforeDelete = await db.query.accounts.findFirst({
                    where: eq(accounts.id, appUser.accountId),
                    columns: { name: true, plan: true },
                });

                // Soft delete all users in the account (only non-deleted users)
                await db
                    .update(users)
                    .set({
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(users.accountId, appUser.accountId),
                            isNull(users.deletedAt),
                        ),
                    );

                // Soft delete the account (only if not already deleted)
                const accountResult = await db
                    .update(accounts)
                    .set({
                        deletedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(
                        and(
                            eq(accounts.id, appUser.accountId),
                            isNull(accounts.deletedAt),
                        ),
                    )
                    .returning({ id: accounts.id });

                if (accountResult.length === 0) {
                    return {
                        ...createActionErrorResponse(
                            "Account not found or already deleted",
                            404,
                        ),
                        intent: "delete_account" as const,
                    };
                }

                // Log account deletion to audit logs
                if (accountBeforeDelete) {
                    try {
                        const { auditUserAction } =
                            await import("~/lib/audit/server");
                        await auditUserAction(
                            appUser,
                            "account.deleted",
                            "accounts",
                            appUser.accountId,
                            {
                                before: {
                                    name: accountBeforeDelete.name,
                                    plan: accountBeforeDelete.plan,
                                    deletedAt: null,
                                },
                                after: {
                                    deletedAt: new Date().toISOString(),
                                },
                            },
                            {
                                accountName: accountBeforeDelete.name,
                                plan: accountBeforeDelete.plan,
                            },
                        );
                    } catch (auditError) {
                        // Log audit error but don't fail the operation
                        const { logger } = await import("~/lib/logging.server");
                        logger.error(
                            "Failed to create audit log for account deletion",
                            {
                                error: auditError,
                                accountId: appUser.accountId,
                            },
                        );
                    }
                }

                // Sign out from Supabase
                const supabase = createServerClient(
                    publicConfig.SUPABASE_URL,
                    publicConfig.SUPABASE_PUBLISHABLE_KEY,
                    {
                        cookies: {
                            get(name: string) {
                                const cookies = parseCookieHeader(
                                    cookieHeader ?? "",
                                );
                                const cookie = cookies.find(
                                    (c) => c.name === name,
                                );
                                return cookie?.value;
                            },
                            set(name: string, value: string, options: any) {
                                const cookieString = serializeCookieHeader(
                                    name,
                                    value,
                                    options,
                                );
                                headers.append("Set-Cookie", cookieString);
                            },
                            remove(name: string, options: any) {
                                const cookieString = serializeCookieHeader(
                                    name,
                                    "",
                                    { ...options, maxAge: 0 },
                                );
                                headers.append("Set-Cookie", cookieString);
                            },
                        },
                    },
                );

                await supabase.auth.signOut();

                // Redirect to login page
                return redirect("/login", { headers });
            } catch (deleteError) {
                const { mapDatabaseError } =
                    await import("~/lib/auth/errors.server");
                return {
                    ...createActionErrorResponse(
                        mapDatabaseError(deleteError),
                        500,
                    ),
                    intent: "delete_account" as const,
                };
            }
        }

        return createActionErrorResponse("Invalid action", 400);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "An error occurred";
        return createActionErrorResponse(message, 500);
    }
}

function DeleteAccountModal({
    onClose,
    error,
}: {
    onClose: () => void;
    error?: string;
}) {
    const [confirmMessage, setConfirmMessage] = useState("");
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const handleOnInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setConfirmMessage(event.target.value);
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="p-0">
                <DialogHeader className="p-4">
                    <DialogTitle>Delete Account</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {" "}
                        This action cannot be undone. This will permanently
                        delete your account and all associated data, including
                        all users, roles, permissions, and subscriptions.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 -mt-8">
                    <Form method="post" className="space-y-4">
                        <input
                            type="hidden"
                            name="intent"
                            value="delete_account"
                        />
                        <div className="space-y-2 p-4">
                            <Label htmlFor="confirmation">
                                Please type "Delete this account" to confirm
                            </Label>
                            <Input
                                id="confirmation"
                                type="text"
                                name="confirmation"
                                placeholder="Delete this account"
                                value={confirmMessage}
                                onChange={handleOnInputChange}
                                disabled={isSubmitting}
                            />
                            {error && (
                                <div className="text-sm text-destructive mt-2">
                                    {error}
                                </div>
                            )}
                        </div>
                        <DialogFooter className="flex justify-end w-full border-t p-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={
                                    confirmMessage !== "Delete this account" ||
                                    isSubmitting
                                }
                            >
                                {isSubmitting
                                    ? "Deleting..."
                                    : "Delete Account"}
                            </Button>
                        </DialogFooter>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function AccountSettings() {
    const { critical, deferred } = useLoaderData<
        typeof loader
    >() as AccountSettingsRouteLoaderData;
    const data = useActionData<typeof action>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (data && Object.keys(data).includes("success")) {
            if (data?.success) {
                if (data?.intent === "update") {
                    toast({
                        title: "Success!",
                        description:
                            "You've successfully updated your account.",
                    });
                }
            }
        }
    }, [data]);

    return (
        <div className="space-y-6 w-full mt-12 md:mt-0">
            <div>
                <h3 className="text-2xl font-medium">Account Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account-level settings.
                </p>
            </div>

            <div className={cn(SURFACE_CLASS)}>
                <div className="space-y-6">
                    <ProgressiveRoutePanel
                        resolve={deferred.primary}
                        fallback={<AccountSettingsFormSkeleton />}
                        errorTitle="Account settings unavailable"
                    >
                        {(primary) => (
                            <AccountSettingsFormPanel
                                account={primary.account}
                                isSubmitting={isSubmitting}
                                navigationIntent={
                                    navigation.formData?.get("intent") ?? null
                                }
                            />
                        )}
                    </ProgressiveRoutePanel>

                    {/* Danger Zone Section - Only for owners with delete permission */}
                    {critical.canDeleteAccount && (
                        <div className={cn(SURFACE_CLASS_DANGER, "p-3")}>
                            <h4 className="text-md font-semibold text-destructive mb-4">
                                Danger Zone
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Once you delete your account, there is no going
                                back. This will permanently delete the account
                                and all associated data, including all users,
                                roles, permissions, and subscriptions. Please be
                                certain.
                            </p>
                            <div>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <DeleteAccountModal
                    onClose={() => setShowDeleteModal(false)}
                    error={
                        data &&
                        "intent" in data &&
                        data.intent === "delete_account"
                            ? "error" in data
                                ? (data.error as string)
                                : "message" in data
                                  ? (data.message as string)
                                  : undefined
                            : undefined
                    }
                />
            )}
        </div>
    );
}

function AccountSettingsFormPanel({
    account,
    isSubmitting,
    navigationIntent,
}: {
    account: DashboardAccountSettingsPrimaryPanelData["account"];
    isSubmitting: boolean;
    navigationIntent: FormDataEntryValue | null;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-md font-semibold mb-4">
                    Account Information
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                    Update your account name and view your plan details.
                </p>
                <Form method="post">
                    <input type="hidden" name="intent" value="update" />
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Account Name</Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={account.name}
                                placeholder="Enter your account name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan">Plan</Label>
                            <Input
                                id="plan"
                                name="plan"
                                value={account.plan}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Plan cannot be changed from this page
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button
                            type="submit"
                            variant="default"
                            disabled={isSubmitting}
                            className="rounded-lg"
                        >
                            {isSubmitting && navigationIntent === "update"
                                ? "Saving..."
                                : "Save Changes"}
                            {isSubmitting && navigationIntent === "update" ? (
                                <LoaderCircle className="w-4 h-4 ml-2 animate-spin" />
                            ) : null}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
}

function AccountSettingsFormSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64" />
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-28 rounded-md" />
                </div>
            </div>
        </div>
    );
}

function streamPanel<T>(promise: Promise<T>) {
    return promise;
}
