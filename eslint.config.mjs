import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts
    "coverage/**",
    // Vendored Veritie SDK (linted via sdk's own scripts)
    "sdk/**",
    // Design exploration copies — not production surfaces
    "ui-suggestions/**",
  ]),
]);

export default eslintConfig;
