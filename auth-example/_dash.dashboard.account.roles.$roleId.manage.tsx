import {
    redirect,
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
} from "react-router";

export async function loader(_args: LoaderFunctionArgs) {
    throw redirect("/dashboard/account");
}

export async function action(_args: ActionFunctionArgs) {
    throw redirect("/dashboard/account");
}

export default function AccountRoleManageRedirect() {
    return null;
}
