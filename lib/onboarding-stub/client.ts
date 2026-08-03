"use client";

import {
    buildBootstrapSummary,
    DEFAULT_CLIENT_STATE,
    parseClientState,
    serializeBootstrapSummary,
    serializeClientState,
    STUB_BOOTSTRAP_COOKIE,
    STUB_ONBOARDING_COMPLETED_COOKIE,
    STUB_ONBOARDING_DRAFT_STORAGE_KEY,
} from "./state";
import type {
    StubOnboardingClientState,
    StubOnboardingProfile,
} from "./types";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function writeCookie(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
}

export function persistOnboardingCompletion(profile: StubOnboardingProfile) {
    writeCookie(STUB_ONBOARDING_COMPLETED_COOKIE, "1");
    writeCookie(
        STUB_BOOTSTRAP_COOKIE,
        serializeBootstrapSummary(buildBootstrapSummary(profile)),
    );
}

export function loadClientDraftState(): StubOnboardingClientState {
    if (typeof window === "undefined") {
        return DEFAULT_CLIENT_STATE;
    }

    return parseClientState(
        window.localStorage.getItem(STUB_ONBOARDING_DRAFT_STORAGE_KEY),
    );
}

export function persistClientDraftState(state: StubOnboardingClientState) {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(
        STUB_ONBOARDING_DRAFT_STORAGE_KEY,
        serializeClientState(state),
    );
}
