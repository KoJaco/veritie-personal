import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppSidebar } from "./AppSidebarProvider";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarGroup } from "./sidebar/SidebarGroup";
import { SidebarItem } from "./sidebar/SidebarItem";
import {
    ListTodo,
    Boxes,
    ServerCog,
    Settings,
    Clock,
    Mic,
    Target,
    Wallet,
    Calendar,
    Bell,
} from "lucide-react";
import dynamic from "next/dynamic";

const SidebarFooter = dynamic(
    () => import("./sidebar/SidebarFooter").then((mod) => mod.SidebarFooter),
    { loading: () => <div>Loading...</div>, ssr: false },
);

function SidebarContent() {
    return (
        <div className="h-full flex flex-col px-6 pb-8">
            <SidebarHeader />
            <div className="h-8" />

            <div className="sidebar-scrollbar flex-1 overflow-y-auto pb-4">
                <SidebarGroup label="Review">
                    <SidebarItem
                        href="/timeline"
                        icon={Clock}
                        label="Timeline"
                    />
                    <SidebarItem
                        href="/captures"
                        icon={Mic}
                        label="Captures"
                    />
                    <SidebarItem
                        href="/events"
                        icon={Calendar}
                        label="Events"
                    />
                    <SidebarItem
                        href="/reminders"
                        icon={Bell}
                        label="Reminders"
                    />
                </SidebarGroup>

                <SidebarGroup label="Plan" className="mt-6">
                    <SidebarItem
                        href="/tasks"
                        icon={ListTodo}
                        label="Tasks"
                    />
                    <SidebarItem
                        href="/goals"
                        icon={Target}
                        label="Goals"
                    />
                    <SidebarItem
                        href="/money"
                        icon={Wallet}
                        label="Money"
                    />
                </SidebarGroup>

                <SidebarGroup label="Library" className="mt-6">
                    <SidebarItem
                        href="/records"
                        icon={Boxes}
                        label="Records"
                    />
                    <SidebarItem
                        href="/resources"
                        icon={ServerCog}
                        label="Resources"
                    />
                </SidebarGroup>

                <SidebarGroup label="System" className="mt-6">
                    <SidebarItem
                        href="/settings"
                        icon={Settings}
                        label="Settings"
                    />
                </SidebarGroup>
            </div>

            <SidebarFooter />
        </div>
    );
}

export function AppSidebar() {
    const { isOpen, setIsOpen } = useAppSidebar();

    return (
        <>
            <aside className="hidden 2xl:block fixed top-0 left-0 bottom-0 w-64 flex-shrink-0 bg-background z-40">
                <SidebarContent />
            </aside>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="left" className="w-[300px] p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    );
}
