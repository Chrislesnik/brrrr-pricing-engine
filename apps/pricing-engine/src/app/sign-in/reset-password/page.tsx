"use client"

import { useSignIn } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AuthLines from "@/assets/svg/auth-lines"

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
    <div className="bg-background flex h-auto min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <Card className="relative w-full max-w-md overflow-hidden border-none pt-12 shadow-lg">
        <div className="to-primary/10 pointer-events-none absolute top-0 h-52 w-full rounded-t-xl bg-gradient-to-t from-transparent"></div>

        <AuthLines className="pointer-events-none absolute inset-x-0 top-0" />

        <CardHeader className="justify-center gap-6 text-center">
          <div>
            <CardTitle className="mb-1.5 text-2xl">Forgot Password?</CardTitle>
            <CardDescription className="text-base">
              Enter your email and we&apos;ll send you a code to reset your password
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <Label className="leading-5" htmlFor="userEmail">
                Email address*
              </Label>
              <Input
                type="email"
                id="userEmail"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button className="w-full" type="submit" disabled={loading || !isLoaded}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending code...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>

          <Button variant="ghost" className="w-full" asChild>
            <Link href="/sign-in">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
