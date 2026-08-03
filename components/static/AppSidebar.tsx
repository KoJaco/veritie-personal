import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAppSidebar } from "./AppSidebarProvider";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarGroup } from "./sidebar/SidebarGroup";
import { SidebarItem } from "./sidebar/SidebarItem";
import {
    ListTodo,
    Boxes,
    ServerCog,
    Plug,
    Settings,
    Shapes,
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
                <SidebarGroup label="Work">
                    <SidebarItem
                        href="/work/tasks"
                        icon={ListTodo}
                        label="Tasks"
                    />
                </SidebarGroup>

                <SidebarGroup label="Library" className="mt-6">
                    <SidebarItem
                        href="/work/resources"
                        icon={ServerCog}
                        label="Resources"
                    />
                    <SidebarItem
                        href="/work/documents"
                        icon={Boxes}
                        label="Documents"
                    />
                </SidebarGroup>

                <SidebarGroup label="Platform" className="mt-6">
                    <SidebarItem
                        href="/work/scopes"
                        icon={Shapes}
                        label="Scopes"
                    />
                    <SidebarItem
                        href="/work/connections"
                        icon={Plug}
                        label="Connections"
                    />
                    <SidebarItem
                        href="/work/settings"
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
