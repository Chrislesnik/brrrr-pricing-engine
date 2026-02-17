import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/signature-requests/webhook",
])

const middleware = clerkMiddleware(async (auth, req) => {
  const isPublic = isPublicRoute(req)

  const a = await auth()

  if (!isPublic && !a.userId) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  if (a.userId && req.nextUrl.pathname.startsWith("/sign-in")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export default middleware

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}
