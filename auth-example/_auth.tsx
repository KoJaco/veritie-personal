import { ArrowLeft, MoveLeft } from "lucide-react";
import { Link, Outlet, useLoaderData } from "react-router";
import { Container } from "~/components/ui/container";

export async function loader() {
    const { getAppName } = await import("~/lib/branding.server");
    return {
        appName: getAppName(),
    };
}

export default function AuthLayout() {
    const { appName } = useLoaderData<typeof loader>();

    return (
        <div className="overflow-x-hidden">
            <header className="absolute top-0 left-0 z-50 w-full">
                <Container className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">{appName}</div>
                        <Link to="/" className="flex gap-2 items-center group">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                            home
                        </Link>
                    </div>
                </Container>
            </header>
            <Outlet />
        </div>
    );
}
