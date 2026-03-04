"use client"

import React from "react"
import { toast } from "@/hooks/use-toast"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    
    // Show toast notification instead of crashing
    toast({
      title: "Something went wrong",
      description: error.message || "An unexpected error occurred. Please try again.",
      variant: "destructive",
    })
  }

  componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    // Auto-recover after showing toast
    if (this.state.hasError && !prevState.hasError) {
      // Reset error state after a short delay to allow re-render
      setTimeout(() => {
        this.setState({ hasError: false, error: null })
      }, 100)
    }
  }

  render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback
    }

    // Even if there was an error, try to render children (auto-recovery)
    return this.props.children
  }
}

// Hook-based error handler for async operations
export function useErrorHandler() {
  return (error: Error | unknown, customMessage?: string) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Error:", error)
    toast({
      title: customMessage || "Error",
      description: message || "An unexpected error occurred",
      variant: "destructive",
    })
  }
}
