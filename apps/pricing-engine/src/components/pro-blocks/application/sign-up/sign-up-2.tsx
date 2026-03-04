"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { RetroGrid } from "@/components/ui/retro-grid";
import { PasswordInput } from "@/components/password-input";
import Link from "next/link";

export function SignUp2() {
  return (
    <div className="bg-background min-h-screen md:flex">
      {/* Left side - Sign-up form */}
      <div className="relative items-center justify-center px-6 py-24 md:flex md:w-1/2">
        <div className="m-auto w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="mb-3 text-2xl font-semibold md:text-3xl">
              Create an account
            </h1>
            <p className="text-muted-foreground text-sm">
              Let's get started. Fill in the details below to create your
              account.
            </p>
          </div>

          {/* Social sign-in buttons */}
          <div className="space-y-2">
            {/* Google sign-in button */}
            <Button variant="outline" className="w-full">
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

          {/* Sign-up form fields */}
          <div className="mb-6 space-y-4">
            {/* Email input */}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <InputGroup>
                <InputGroupInput id="email" placeholder="Email" type="email" />
              </InputGroup>
            </Field>

            {/* Password input */}
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                  id="password"
                  placeholder="Password"
                />
              <p className="text-muted-foreground text-sm">
                Minimum 8 characters.
              </p>
            </Field>
            {/* Terms and conditions checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <FieldLabel htmlFor="terms" className="text-sm font-normal">
                <p>
                  I agree to the{" "}
                  <Link href="#" className="text-foreground underline">
                    Terms & Conditions
                  </Link>
                </p>
              </FieldLabel>
            </div>
          </div>

          {/* Sign-up button and sign-in link */}
          <div className="flex flex-col space-y-4">
            <Button className="w-full">Sign up</Button>
            <p className="text-muted-foreground text-center text-sm">
            Already have an account?{" "}
            <Link className="text-foreground underline" href="/sign-in">
              Sign in
            </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Retro Grid */}
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
