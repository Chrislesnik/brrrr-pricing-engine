import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url)
  const pathname = url.pathname

  // Public routes that should not require auth
  const isPublic =
    /^\/$/.test(pathname) ||
    /^\/sign-in(\/.*)?$/.test(pathname) ||
    /^\/sign-up(\/.*)?$/.test(pathname) ||
    /^\/api\/webhooks(\/.*)?$/.test(pathname)

  const { userId } = await auth()

  // Redirect authenticated users away from /sign-in back to app
  if (userId && /^\/sign-in(\/.*)?$/.test(pathname)) {
    return Response.redirect(new URL("/pipeline", req.url))
  }

  // Protect everything that isn't public
  if (!isPublic && !userId) {
    return Response.redirect(new URL("/sign-in", req.url))
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


