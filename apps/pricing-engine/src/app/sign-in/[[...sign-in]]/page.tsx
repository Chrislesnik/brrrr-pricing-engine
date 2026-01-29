"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignIn afterSignInUrl="/pipeline" afterSignUpUrl="/pipeline" signUpUrl="/sign-up" />
    </div>
  )
}


