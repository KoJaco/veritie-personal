import { redirect, type ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
    const { createAuthSupabaseClient } =
        await import("~/lib/auth/utils.server");
    const { supabase, headers } = await createAuthSupabaseClient(request);

    await supabase.auth.signOut();

    return redirect("/", { headers });
}
