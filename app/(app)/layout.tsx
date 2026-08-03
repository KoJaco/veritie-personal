import { AppShellClient } from "@/components/static/AppShellClient";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppShellClient>{children}</AppShellClient>;
}
