import { redirect } from "next/navigation"

export default function Page() {
  // #region agent log
  fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: "debug-session",
      runId: "run5",
      hypothesisId: "H7",
      location: "(dashboard-1)/page.tsx:5",
      message: "redirect root to pipeline",
      data: {},
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  redirect("/scenarios")
}
