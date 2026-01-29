"use client"

import { useSignIn } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const { isLoaded, signIn } = useSignIn()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    setLoading(true)
    setError("")

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      })

      // Store email in session storage for the verify page
      sessionStorage.setItem("reset_password_email", email)
      
      router.push("/sign-in/reset-password/verify")
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[] }
      setError(clerkError.errors?.[0]?.message || "Failed to send reset code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6 py-24">
      {/* Reset password form container */}
      <div className="w-full max-w-sm space-y-6">
        {/* Back link */}
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Reset password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we&apos;ll send you a code to reset your password.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </InputGroup>
          </Field>

          <Button type="submit" className="w-full" disabled={loading || !isLoaded}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending code...
              </>
            ) : (
              "Send reset code"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
