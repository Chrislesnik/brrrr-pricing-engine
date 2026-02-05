"use client";

import { ProgramsSettingsClient } from "./programs-settings-client";

// For now, start with empty programs array
// The client component will handle fetching via API
export function ProgramsSettings() {
  return <ProgramsSettingsClient initialPrograms={[]} />;
}
