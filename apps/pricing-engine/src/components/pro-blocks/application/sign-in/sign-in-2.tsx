"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { RetroGrid } from "@/components/ui/retro-grid";

export function SignIn2() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/pipeline");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/pipeline",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] };
      setError(clerkError.errors?.[0]?.message || "Google sign in failed");
    }
  };

  return (
    <div className="bg-background min-h-screen md:flex">
      {/* Left side: Sign-in form */}
      <div className="relative items-center justify-center px-6 py-24 md:flex md:w-1/2">
        {/* Sign-in form container */}
        <div className="m-auto w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold">Sign in</h1>
            <p className="text-muted-foreground text-sm">
              Sign in to access loan pricing, term sheets, and manage your
              lending pipeline.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Social sign-in buttons */}
          <div className="space-y-2">
            {/* Google sign-in button */}
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_772_376)">
                  <path
                    d="M8 6.54543V9.64361H12.3054C12.1164 10.64 11.549 11.4836 10.6981 12.0509L13.2945 14.0655C14.8072 12.6692 15.68 10.6182 15.68 8.18187C15.68 7.61461 15.6291 7.0691 15.5345 6.54551L8 6.54543Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M3.51625 9.52267L2.93067 9.97093L0.85791 11.5854C2.17427 14.1963 4.87225 16 7.9995 16C10.1594 16 11.9703 15.2873 13.294 14.0655L10.6976 12.0509C9.98492 12.5309 9.07582 12.8218 7.9995 12.8218C5.91951 12.8218 4.15229 11.4182 3.51952 9.52729L3.51625 9.52267Z"
                    fill="#34A853"
                  />
                  <path
                    d="M0.858119 4.41455C0.312695 5.49087 0 6.70543 0 7.99996C0 9.29448 0.312695 10.509 0.858119 11.5854C0.858119 11.5926 3.51998 9.51991 3.51998 9.51991C3.35998 9.03991 3.26541 8.53085 3.26541 7.99987C3.26541 7.46889 3.35998 6.95984 3.51998 6.47984L0.858119 4.41455Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M7.99966 3.18545C9.17786 3.18545 10.2251 3.59271 11.0615 4.37818L13.3524 2.0873C11.9633 0.792777 10.1597 0 7.99966 0C4.87242 0 2.17427 1.79636 0.85791 4.41455L3.51969 6.48001C4.15238 4.58908 5.91968 3.18545 7.99966 3.18545Z"
                    fill="#EA4335"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_772_376">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>

              <span>Sign in with Google</span>
            </Button>

          </div>

          {/* Separator */}
          <div className="relative w-full">
            <div className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform px-2 text-xs uppercase">
              Or
            </div>
            <Separator />
          </div>

          {/* Email and password inputs */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="email2">Email</FieldLabel>
              <InputGroup>
                <InputGroupInput 
                  id="email2" 
                  placeholder="Email" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password2">Password</FieldLabel>
                <Link
                  href="/sign-in/reset-password"
                  className="text-muted-foreground hover:text-foreground text-sm underline"
                >
                  Forgot password?
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  id="password2"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Field>

            {/* Sign-in button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Sign-up link */}
          <p className="text-muted-foreground text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link className="text-foreground underline" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Retro Grid */}
      <div className="relative hidden md:block md:w-1/2 overflow-hidden">
        <RetroGrid 
          className="absolute inset-0" 
          angle={65}
          cellSize={60}
          opacity={0.6}
          lineColor="#6366f1"
        />
      </div>
    </div>
  );
}
