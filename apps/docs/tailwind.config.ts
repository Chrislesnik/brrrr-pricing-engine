import type { Config } from "tailwindcss";
import { baseConfig } from "@repo/tailwind-config/base";

const config: Config = {
  ...baseConfig,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.mdx",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  plugins: [
    ...(baseConfig.plugins || []),
    require("@tailwindcss/typography"),
  ],
};

export default config;
