import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/ai-chatbot/**",
      "src/types/database.types.ts",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "react-hooks": reactHooks,
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-await-in-loop": "off", // Allow await in loops - often needed for sequential processing
      "no-duplicate-imports": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-unused-vars": [
        "off", // Disabled to allow helper functions that may be used later
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
