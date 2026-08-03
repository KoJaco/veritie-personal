/** Bound browser fetch for Veritie SDK (avoids Illegal invocation). */
export const browserFetch: typeof fetch = (input, init) =>
    window.fetch.call(window, input, init);
