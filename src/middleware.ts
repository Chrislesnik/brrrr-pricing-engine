import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware((auth, req) => {
  // Protect all non-public routes (Clerk will handle redirection)
  if (!isPublicRoute(req)) {
    auth().protect()
  }

  // If an authenticated user visits /sign-in, send them to the app
  const { userId } = auth()
  if (userId && req.nextUrl.pathname.startsWith("/sign-in")) {
    return NextResponse.redirect(new URL("/pipeline", req.url))
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}


