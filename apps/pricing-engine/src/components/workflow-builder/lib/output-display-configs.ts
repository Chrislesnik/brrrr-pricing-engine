/**
 * Output display configs stub
 * Used by workflow-runs.tsx to display step outputs -- stub for now
 */

export type OutputDisplayConfig = {
  label: string;
  render?: (value: unknown) => string;
};

export const OUTPUT_DISPLAY_CONFIGS: Record<string, OutputDisplayConfig> = {};
