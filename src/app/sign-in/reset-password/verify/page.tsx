"use client"

import { useSignIn } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import Link from "next/link"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ResetPasswordVerifyPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem("reset_password_email")
    if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // Redirect back if no email stored
      router.push("/sign-in/reset-password")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      })

      if (result.status === "complete") {
        // Clear the stored email
        sessionStorage.removeItem("reset_password_email")
        
        // Show success message briefly then redirect
        setSuccess(true)
        await setActive({ session: result.createdSessionId })
        
        setTimeout(() => {
          router.push("/pipeline")
        }, 2000)
      } else {
        setError("Password reset incomplete. Please try again.")
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message?: string }[] }
      setError(clerkError.errors?.[0]?.message || "Failed to reset password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm space-y-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-semibold">Password reset successful!</h1>
          <p className="text-muted-foreground text-sm">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center px-6 py-24">
      {/* Verify form container */}
      <div className="w-full max-w-sm space-y-6">
        {/* Back link */}
        <Link
          href="/sign-in/reset-password"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Enter code</h1>
          <p className="text-muted-foreground text-sm">
            We sent a code to <span className="font-medium text-foreground">{email}</span>. 
            Enter the code below along with your new password.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Verification form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="code">Verification code</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                disabled={loading}
                maxLength={6}
                inputMode="numeric"
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </InputGroup>
          </Field>

          <Button type="submit" className="w-full" disabled={loading || !isLoaded}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Resetting password...
              </>
            ) : (
              "Reset password"
            )}
          </Button>
        </form>

        {/* Resend code link */}
        <p className="text-muted-foreground text-center text-sm">
          Didn&apos;t receive the code?{" "}
          <Link
            href="/sign-in/reset-password"
            className="text-foreground underline"
          >
            Resend
          </Link>
        </p>
      </div>
    </div>
  )
}
