export function getEnvVar(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export function getEnvVarOptional(
    key: string,
    defaultValue?: string
): string | undefined {
    const value = process.env[key];
    return value ?? defaultValue;
}

export function getBooleanEnvVar(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        return false;
    }
    return value === "true" || value === "1";
}

export function getNumberEnvVar(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Missing required environment variable: ${key}`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(
            `Invalid number value for environment variable: ${key}`
        );
    }
    return parsed;
}
