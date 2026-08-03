import { cookies } from "next/headers";
import {
    buildServerBootstrap,
    STUB_BOOTSTRAP_COOKIE,
    STUB_ONBOARDING_COMPLETED_COOKIE,
} from "./state";

export async function getStubServerBootstrap() {
    const cookieStore = await cookies();

    return buildServerBootstrap({
        onboardingCompleted: cookieStore.get(
            STUB_ONBOARDING_COMPLETED_COOKIE,
        )?.value,
        summary: cookieStore.get(STUB_BOOTSTRAP_COOKIE)?.value,
    });
}
