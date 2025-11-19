"use client"

import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignUp afterSignInUrl="/pipeline" afterSignUpUrl="/pipeline" signInUrl="/sign-in" />
    </div>
  )
}


