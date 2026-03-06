"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@repo/ui/shadcn/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ChatErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 max-w-sm w-full">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-destructive">
                  Something went wrong
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  {this.props.fallbackMessage ??
                    "The chat encountered an error. Try refreshing."}
                </p>
                {this.state.error && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono truncate">
                    {this.state.error.message}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 text-[12px]"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="mr-1.5 h-3 w-3" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
