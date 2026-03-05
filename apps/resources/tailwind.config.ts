import type { Config } from "tailwindcss";
import { baseConfig } from "@repo/tailwind-config/base";
import typography from "@tailwindcss/typography";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [...(baseConfig.plugins || []), typography],
};

export default config;
