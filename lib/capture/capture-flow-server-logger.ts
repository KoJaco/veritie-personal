import { logger } from "@/lib/logging/server-logger";

const PREFIX = "[capture-flow]";

export const captureFlowServerLog = {
    debug(step: string, context?: Record<string, unknown>): void {
        logger.debug(`${PREFIX} ${step}`, context);
    },
    info(step: string, context?: Record<string, unknown>): void {
        logger.info(`${PREFIX} ${step}`, context);
    },
    warn(step: string, context?: Record<string, unknown>): void {
        logger.warn(`${PREFIX} ${step}`, context);
    },
    error(step: string, context?: Record<string, unknown>): void {
        logger.error(`${PREFIX} ${step}`, context);
    },
};
