import type { Config } from "jest";
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Next.js Jest setup requires CommonJS require
const nextJest = require("next/jest");

const createJestConfig = nextJest({
    dir: "./",
});

// any custom configs in here
const config: Config = {
    coverageProvider: "v8",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },
    testMatch: [
        "**/__tests__/**/*.[jt]s?(x)",
        "**/?(*.)+(spec|test).[jt]s?(x)",
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/.next/",
        "/.vercel/",
        "/dist/",
        "/build/",
        "<rootDir>/sdk/",
    ],
    collectCoverageFrom: [
        "app/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "!**/*.d.ts",
        "!**/node_modules/**",
        "!**/.next/**",
    ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(config);
