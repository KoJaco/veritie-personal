import {
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";

export async function loader(_args: LoaderFunctionArgs) {
    return redirect("/dashboard/settings");
}

export async function action(_args: ActionFunctionArgs) {
    return redirect("/dashboard/settings");
}

export default function SetupMfaRedirect() {
    return null;
}
