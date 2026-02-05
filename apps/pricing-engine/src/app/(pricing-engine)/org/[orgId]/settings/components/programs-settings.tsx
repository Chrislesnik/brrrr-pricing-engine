"use client";

import { useState } from "react";
import { Loader2, Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/shadcn/card";

export function ProgramsSettings() {
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Programs</h2>
        <p className="mt-1 text-muted-foreground">
          Manage loan programs and product offerings for your organization
        </p>
      </div>

      {/* Programs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Program Configuration
          </CardTitle>
          <CardDescription>
            Configure loan programs available to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading programs...</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Program management interface coming soon.</p>
              <p className="mt-2">
                This section will allow you to configure:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Available loan programs (DSCR, Fix & Flip, etc.)</li>
                <li>Program-specific settings and parameters</li>
                <li>Pricing guidelines and constraints</li>
                <li>Custom program configurations</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
