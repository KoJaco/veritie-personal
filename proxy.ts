import { NextResponse, type NextRequest } from "next/server";

import { sanitizeRedirectPath } from "@/lib/auth/safe-redirect";
import { updateSession } from "@/lib/supabase/middleware";

function isPublicPath(pathname: string): boolean {
    if (pathname === "/") {
        return true;
    }

    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
        return true;
    }

    if (pathname === "/auth" || pathname.startsWith("/auth/")) {
        return true;
    }

    return false;
}

function requiresAuth(pathname: string): boolean {
    if (isPublicPath(pathname)) {
        return false;
    }

    if (pathname.startsWith("/api/")) {
        return true;
    }

    // All other matched routes (app shell pages) require a session.
    return true;
}

function isApiPath(pathname: string): boolean {
    return pathname.startsWith("/api/");
}

function copySessionCookies(from: NextResponse, to: NextResponse): void {
    from.cookies.getAll().forEach((cookie) => {
        to.cookies.set(cookie);
    });
}

function unauthorizedApiResponse(sessionResponse: NextResponse): NextResponse {
    const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    copySessionCookies(sessionResponse, response);
    return response;
}

export async function proxy(request: NextRequest) {
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl;

    if (!requiresAuth(pathname)) {
        return response;
    }

    if (user) {
        return response;
    }

    if (isApiPath(pathname)) {
        return unauthorizedApiResponse(response);
    }

    const loginUrl = new URL(request.nextUrl.href);
    loginUrl.pathname = "/auth/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", sanitizeRedirectPath(pathname));

    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
