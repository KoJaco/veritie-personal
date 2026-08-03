import type { FetchLike } from "../types";

/**
 * Browser fetch must not be extracted and called unbound (Illegal invocation).
 * Use .call(window) so Turbopack/bundlers cannot break the binding.
 */
export const defaultFetch: FetchLike = (input, init) => {
    if (typeof window !== "undefined" && typeof window.fetch === "function") {
        return window.fetch.call(window, input, init);
    }

    return fetch(input, init);
};
