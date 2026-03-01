"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const EXPIRATION_OPTIONS = [
  { value: "", label: "Never expires" },
  { value: "86400", label: "1 day" },
  { value: "604800", label: "7 days" },
  { value: "2592000", label: "30 days" },
  { value: "7776000", label: "90 days" },
  { value: "31536000", label: "1 year" },
];

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage API keys for third-party integrations.
            Keys authenticate external services to interact with your
            organization&apos;s data.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="size-4 mr-1.5" />
          Create Key
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
          <Key className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No API keys yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm">
            Create an API key to allow external services to access your
            organization&apos;s data via authenticated requests.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="size-4 mr-1.5" />
            Create your first key
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{key.name}</span>
                      {key.description && (
                        <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {key.description}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/60 font-mono mt-0.5">
                        {key.id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes?.map((scope) => (
                        <Badge
                          key={scope}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {scope}
                        </Badge>
                      )) ?? (
                        <span className="text-xs text-muted-foreground">
                          No scopes
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {key.expiration
                      ? new Date(key.expiration).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRevokeTarget(key)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          Revoke key
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <DialogTitle>Create API Key</DialogTitle>
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
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border p-3">
                {availableScopes.length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground py-2 text-center">
                    No API resource scopes are enabled. Use the Policy Builder
                    to create <span className="font-medium">API Access</span>{" "}
                    policies first.
                  </p>
                ) : (
                  availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={newKeyScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="rounded border-input"
                      />
                      <span>{scope.label}</span>
                    </label>
                  ))
                )}
              </div>
              {newKeyScopes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {newKeyScopes.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
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
                    <SelectItem key={opt.value || "never"} value={opt.value || "never"}>
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
              {isCreating && <Loader2 className="size-4 mr-1.5 animate-spin" />}
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
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key secret now. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 font-mono text-sm">
              <span className="flex-1 truncate select-all">
                {showSecret ? createdSecret : "•".repeat(40)}
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
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Store this secret securely. You will not be able to see it
              again after closing this dialog.
            </p>
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
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke{" "}
              <span className="font-medium text-foreground">
                {revokeTarget?.name}
              </span>
              ? This action is permanent and any requests using this key will
              be immediately rejected.
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
