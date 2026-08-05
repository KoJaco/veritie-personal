import { CAPTURES_PERSIST_MAX_BODY_BYTES } from "@/lib/capture/captures-persist-schema";
import { VERITIE_PROXY_MAX_BODY_BYTES } from "@/lib/veritie/proxy-request";

export const DEFAULT_JSON_API_MAX_BODY_BYTES = 64 * 1024;

export const EXTRACTED_VALUE_REVIEW_MAX_BODY_BYTES = 16 * 1024;

export {
    CAPTURES_PERSIST_MAX_BODY_BYTES,
    VERITIE_PROXY_MAX_BODY_BYTES,
};
