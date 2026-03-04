"use client"

import { useSignIn } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/password-input"
import AuthLines from "@/assets/svg/auth-lines"

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
          router.push("/dashboard")
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
      <div className="bg-background flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <Card className="relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg">
          <div className="to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent"></div>
          <AuthLines className="pointer-events-none absolute inset-x-0 top-0" />
          
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Password reset successful!</h1>
            <p className="text-muted-foreground text-sm">
              Redirecting you to the dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <Card className="relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg">
        <div className="to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent"></div>

        <AuthLines className="pointer-events-none absolute inset-x-0 top-0" />

        <CardHeader className="justify-center gap-6 text-center">
          <div>
            <CardTitle className="mb-1.5 text-2xl">Enter Verification Code</CardTitle>
            <CardDescription className="text-base">
              We sent a code to <span className="font-medium text-foreground">{email}</span>.
              Enter the code below along with your new password.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label className="leading-5" htmlFor="code">
                Verification Code*
              </Label>
              <Input
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
            </div>

            <div className="space-y-1">
              <Label className="leading-5" htmlFor="password">
                New Password*
              </Label>
              <PasswordInput
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <Label className="leading-5" htmlFor="confirmPassword">
                Confirm Password*
              </Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
            </div>

            <Button className="w-full" type="submit" disabled={loading || !isLoaded}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <p className="text-muted-foreground text-center text-sm pt-2">
            Didn&apos;t receive the code?{" "}
            <Link
              href="/sign-in/reset-password"
              className="text-foreground underline"
            >
              Resend
            </Link>
          </p>

          <Button variant="ghost" className="w-full" asChild>
            <Link href="/sign-in">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
