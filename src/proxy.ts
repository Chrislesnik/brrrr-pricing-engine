import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api/webhooks(.*)"])

export function proxy(request: NextRequest) {
  return clerkMiddleware(async (auth, req) => {
    const isPublic = isPublicRoute(req)

    // #region agent log
    fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H1",
        location: "proxy.ts:12",
        message: "middleware entry",
        data: { path: req.nextUrl.pathname, isPublic },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    const a = await auth()

    // #region agent log
    fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H1",
        location: "proxy.ts:30",
        message: "auth resolved",
        data: { path: req.nextUrl.pathname, userId: a.userId ?? null, isPublic },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    if (!isPublic && !a.userId) {
      // #region agent log
      fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "H2",
          location: "proxy.ts:48",
          message: "redirecting unauthenticated to sign-in",
          data: { path: req.nextUrl.pathname },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      const signInUrl = new URL("/sign-in", req.url)
      signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(signInUrl)
    }

    if (a.userId && req.nextUrl.pathname.startsWith("/sign-in")) {
      // #region agent log
      fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "debug-session",
          runId: "run1",
          hypothesisId: "H3",
          location: "proxy.ts:70",
          message: "redirecting authenticated away from sign-in",
          data: { path: req.nextUrl.pathname },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion

      return NextResponse.redirect(new URL("/pipeline", req.url))
    }

    // #region agent log
    fetch("http://127.0.0.1:7248/ingest/ec0bec5e-b211-47a6-b631-2389d2cc86bc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "H1",
        location: "proxy.ts:87",
        message: "middleware pass-through",
        data: { path: req.nextUrl.pathname, isPublic },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion

    return NextResponse.next()
  })(request)
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}
