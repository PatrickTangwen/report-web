import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["_site/**", "frontend/generated/**", "frontend/dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["frontend/src/**/*.ts", "e2e/**/*.ts", "*.config.{ts,mts}"],
    rules: {
      "no-constant-condition": "error",
      "no-debugger": "error",
    },
  },
);
