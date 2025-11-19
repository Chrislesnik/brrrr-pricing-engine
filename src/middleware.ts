import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  // If signed in and hitting sign-in, redirect to pipeline
  if (userId && new URL(req.url).pathname.startsWith("/sign-in")) {
    return Response.redirect(new URL("/pipeline", req.url))
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


