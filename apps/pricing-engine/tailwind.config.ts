import type { Config } from "tailwindcss";
import { baseConfig } from "@repo/tailwind-config/base";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "./ai-chatbot/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
