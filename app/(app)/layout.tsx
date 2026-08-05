import { AppShellClient } from "@/components/static/AppShellClient";
import { ensureActiveSessionOrRedirect } from "@/lib/auth/ensure-active-session";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await ensureActiveSessionOrRedirect();

    return <AppShellClient>{children}</AppShellClient>;
}
