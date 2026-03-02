"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
  Plus,
  Loader2,
  Copy,
  Check,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Key,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/shadcn/table";
import { cn } from "@repo/lib/cn";

interface APIKeyData {
  id: string;
  name: string;
  description?: string | null;
  subject: string;
  scopes: string[] | null;
  claims: Record<string, unknown> | null;
  revoked: boolean;
  expired: boolean;
  expiration: number | null;
  createdAt: number;
  createdBy?: string;
  secret?: string;
}

interface ScopeOption {
  value: string;
  label: string;
  group: string;
}

type KeyStatus = "active" | "expiring_soon" | "expired" | "revoked";

function getKeyStatus(key: APIKeyData): KeyStatus {
  if (key.revoked) return "revoked";
  if (key.expired) return "expired";
  if (key.expiration) {
    const daysUntilExpiration =
      (key.expiration - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiration <= 7 && daysUntilExpiration > 0)
      return "expiring_soon";
    if (daysUntilExpiration <= 0) return "expired";
  }
  return "active";
}

function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);
  const isFuture = diff < 0;

  const minutes = Math.floor(absDiff / (1000 * 60));
  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);

  let relative: string;
  if (minutes < 1) relative = "just now";
  else if (minutes < 60)
    relative = `${minutes}m ${isFuture ? "from now" : "ago"}`;
  else if (hours < 24)
    relative = `${hours}h ${isFuture ? "from now" : "ago"}`;
  else if (days < 30)
    relative = `${days}d ${isFuture ? "from now" : "ago"}`;
  else relative = `${months}mo ${isFuture ? "from now" : "ago"}`;

  return relative;
}

function truncateKeyId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}...${id.slice(-6)}`;
}

const STATUS_CONFIG: Record<
  KeyStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30",
  },
  expiring_soon: {
    label: "Expiring soon",
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30",
  },
  expired: {
    label: "Expired",
    className:
      "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400 dark:border-red-500/30",
  },
  revoked: {
    label: "Revoked",
    className:
      "bg-zinc-500/10 text-zinc-500 border-zinc-500/20 dark:text-zinc-400 dark:border-zinc-500/30",
  },
};

const CHIP_BASE =
  "inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0";

const EXPIRATION_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "86400", label: "1 day" },
  { value: "604800", label: "7 days" },
  { value: "2592000", label: "30 days" },
  { value: "7776000", label: "90 days" },
  { value: "31536000", label: "1 year" },
];

function StatusBadge({ status }: { status: KeyStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn(CHIP_BASE, config.className)}>
      {config.label}
    </span>
  );
}

function KeyRow({
  apiKey,
  onRevoke,
  onCopyId,
}: {
  apiKey: APIKeyData;
  onRevoke: (key: APIKeyData) => void;
  onCopyId: (text: string) => void;
}) {
  const status = getKeyStatus(apiKey);
  const isInactive = status === "revoked" || status === "expired";
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = () => {
    onCopyId(apiKey.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const expiresChip = (() => {
    if (!apiKey.expiration) {
      return (
        <span className={cn(CHIP_BASE, STATUS_CONFIG.active.className)}>
          Never
        </span>
      );
    }
    if (status === "expired") {
      return (
        <span className={cn(CHIP_BASE, STATUS_CONFIG.expired.className)}>
          Expired
        </span>
      );
    }
    if (status === "expiring_soon") {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger>
              <span className={cn(CHIP_BASE, STATUS_CONFIG.expiring_soon.className)}>
                {formatRelativeDate(apiKey.expiration)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {new Date(apiKey.expiration).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>
            <span className={cn(CHIP_BASE, "border-border bg-muted/50")}>
              {formatRelativeDate(apiKey.expiration)}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {new Date(apiKey.expiration).toLocaleString()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  })();

  return (
    <TableRow
      className={cn(
        "group",
        isInactive && "bg-muted/30 opacity-75"
      )}
    >
      {/* Key */}
      <TableCell className="py-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
              isInactive
                ? "bg-muted border-border"
                : "bg-background border-border"
            )}
          >
            <Key
              className={cn(
                "size-3.5",
                isInactive
                  ? "text-muted-foreground/50"
                  : "text-foreground/70"
              )}
            />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium text-sm truncate",
                  isInactive && "line-through decoration-muted-foreground/40"
                )}
              >
                {apiKey.name}
              </span>
              <StatusBadge status={status} />
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    {truncateKeyId(apiKey.id)}
                    {copiedId ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {copiedId ? "Copied!" : "Copy key ID"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </TableCell>

      {/* Description */}
      <TableCell className="py-3">
        {apiKey.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 max-w-[180px]">
            {apiKey.description}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </TableCell>

      {/* Scopes */}
      <TableCell className="py-3">
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {apiKey.scopes && apiKey.scopes.length > 0 ? (
            <>
              {apiKey.scopes.slice(0, 3).map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap font-mono"
                >
                  {scope}
                </span>
              ))}
              {apiKey.scopes.length > 3 && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap cursor-default">
                        +{apiKey.scopes.length - 3} more
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="text-xs max-w-xs"
                    >
                      {apiKey.scopes.slice(3).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </>
          ) : (
            <span className="text-xs text-muted-foreground/50 italic">
              No scopes
            </span>
          )}
        </div>
      </TableCell>

      {/* Expires */}
      <TableCell className="py-3 text-right">
        {expiresChip}
      </TableCell>

      {/* Created */}
      <TableCell className="py-3 text-right text-xs text-muted-foreground">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger className="inline-flex items-center gap-1.5 cursor-default">
              <Clock className="size-3 text-muted-foreground/60" />
              <span>{formatRelativeDate(apiKey.createdAt)}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {new Date(apiKey.createdAt).toLocaleString()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3 w-[50px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleCopyId}>
              <Copy className="size-4 mr-2" />
              Copy key ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => onRevoke(apiKey)}
              disabled={isInactive}
            >
              <Trash2 className="size-4 mr-2" />
              Revoke key
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function APIKeysSettings() {
  const { organization, isLoaded } = useOrganization();
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableScopes, setAvailableScopes] = useState<ScopeOption[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyExpiration, setNewKeyExpiration] = useState("");

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<APIKeyData | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const stats = useMemo(() => {
    const active = apiKeys.filter(
      (k) => getKeyStatus(k) === "active" || getKeyStatus(k) === "expiring_soon"
    ).length;
    const expiringSoon = apiKeys.filter(
      (k) => getKeyStatus(k) === "expiring_soon"
    ).length;
    return { total: apiKeys.length, active, expiringSoon };
  }, [apiKeys]);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [keysRes, scopesRes] = await Promise.all([
        fetch("/api/org/api-keys"),
        fetch("/api/org/api-keys/scopes"),
      ]);

      if (!keysRes.ok) {
        const body = await keysRes.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load API keys");
      }
      const { data: keysData } = await keysRes.json();
      setApiKeys(Array.isArray(keysData) ? keysData : []);

      if (scopesRes.ok) {
        const { data: scopesData } = await scopesRes.json();
        setAvailableScopes(Array.isArray(scopesData) ? scopesData : []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && organization) {
      fetchKeys();
    }
  }, [isLoaded, organization, fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    if (newKeyScopes.length === 0) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/org/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          description: newKeyDescription.trim() || undefined,
          scopes: newKeyScopes,
          secondsUntilExpiration: newKeyExpiration
            ? parseInt(newKeyExpiration, 10)
            : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create API key");
      }

      const { data } = await res.json();
      setCreatedSecret(data.secret);
      setShowSecret(true);
      setNewKeyName("");
      setNewKeyDescription("");
      setNewKeyScopes([]);
      setNewKeyExpiration("");
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      const res = await fetch("/api/org/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeyId: revokeTarget.id,
          revocationReason: "Revoked by organization admin",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to revoke API key");
      }

      setRevokeTarget(null);
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">API Keys</h2>
          <p className="text-sm text-muted-foreground max-w-lg">
            Create and manage API keys for third-party integrations. Keys
            authenticate external services to interact with your
            organization&apos;s data.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="size-4 mr-1.5" />
          Create Key
        </Button>
      </div>

      {/* Stats bar (only when keys exist) */}
      {!isLoading && apiKeys.length > 0 && (
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="font-medium text-foreground">{stats.total}</span>
            <span>{stats.total === 1 ? "key" : "keys"} total</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">{stats.active}</span>
            <span>active</span>
          </div>
          {stats.expiringSoon > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                <span className="font-medium">{stats.expiringSoon}</span>
                <span>expiring soon</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Table / Empty / Loading */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading API keys...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : apiKeys.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted mb-4">
              <Key className="size-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base">No API keys yet</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
              Create an API key to allow external services to access your
              organization&apos;s data via authenticated requests.
            </p>
            <Button
              size="sm"
              className="mt-5"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="size-4 mr-1.5" />
              Create your first key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="h-9 text-xs font-medium">Key</TableHead>
                <TableHead className="h-9 text-xs font-medium">Description</TableHead>
                <TableHead className="h-9 text-xs font-medium">Scopes</TableHead>
                <TableHead className="h-9 text-xs font-medium text-right">Expires</TableHead>
                <TableHead className="h-9 text-xs font-medium text-right">Created</TableHead>
                <TableHead className="h-9 w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody className="bg-background">
              {apiKeys.map((key) => (
                <KeyRow
                  key={key.id}
                  apiKey={key}
                  onRevoke={setRevokeTarget}
                  onCopyId={copyText}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Info footer */}
      {!isLoading && apiKeys.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground/70">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          <p>
            API key secrets are only shown once at creation. If you lose a key,
            revoke it and create a new one.
          </p>
        </div>
      )}

      {/* Create API Key Dialog */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setNewKeyName("");
            setNewKeyDescription("");
            setNewKeyScopes([]);
            setNewKeyExpiration("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Key className="size-4 text-primary" />
              </div>
              Create API Key
            </DialogTitle>
            <DialogDescription>
              Generate a new API key for external integrations. The key secret
              will only be shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., CRM Integration"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-description">Description (optional)</Label>
              <Textarea
                id="key-description"
                placeholder="What this key will be used for..."
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Scopes <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Select the permissions this API key should have.
              </p>
              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto rounded-lg border p-2">
                {availableScopes.length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground py-4 text-center">
                    No API resource scopes are enabled. Use the Policy Builder
                    to create <span className="font-medium">API Access</span>{" "}
                    policies first.
                  </p>
                ) : (
                  availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      className={cn(
                        "flex items-center gap-2.5 text-sm cursor-pointer rounded-md px-2.5 py-2 transition-colors",
                        newKeyScopes.includes(scope.value)
                          ? "bg-primary/5 text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="rounded border-input accent-primary"
                      />
                      <span className="text-[13px]">{scope.label}</span>
                    </label>
                  ))
                )}
              </div>
              {newKeyScopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {newKeyScopes.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="text-xs font-mono gap-1"
                    >
                      {s}
                      <button
                        onClick={() => toggleScope(s)}
                        className="ml-0.5 hover:text-foreground transition-colors"
                      >
                        &times;
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-expiration">Expiration</Label>
              <Select
                value={newKeyExpiration}
                onValueChange={setNewKeyExpiration}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Never expires" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value || "never"}
                      value={opt.value || "never"}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating || !newKeyName.trim() || newKeyScopes.length === 0
              }
            >
              {isCreating && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Display Dialog */}
      <Dialog
        open={!!createdSecret}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedSecret(null);
            setShowSecret(false);
            setCopiedSecret(false);
            setShowCreateDialog(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy your API key secret now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-3 font-mono text-sm">
              <span className="flex-1 truncate select-all">
                {showSecret ? createdSecret : "\u2022".repeat(40)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 flex-shrink-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 flex-shrink-0"
                onClick={() => createdSecret && copyToClipboard(createdSecret)}
              >
                {copiedSecret ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                Store this secret securely. You will not be able to see it again
                after closing this dialog.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setCreatedSecret(null);
                setShowSecret(false);
                setCopiedSecret(false);
                setShowCreateDialog(false);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                <ShieldAlert className="size-4 text-destructive" />
              </div>
              Revoke API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget?.name}
              </span>
              ? This action is permanent and any requests using this key will be
              immediately rejected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking && (
                <Loader2 className="size-4 mr-1.5 animate-spin" />
              )}
              Revoke Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
