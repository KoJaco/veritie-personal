import { type LoaderFunctionArgs, redirect } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
    const { requirePermission } = await import("~/lib/permissions.server");

    await requirePermission(request, "account", "retrieve");

    return redirect("/dashboard/account");
}

export default function AccountVoiceLogsSettings() {
    return null;
}
