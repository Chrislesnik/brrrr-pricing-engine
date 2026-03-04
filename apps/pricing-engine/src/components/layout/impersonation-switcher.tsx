"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover";
import { Badge } from "@repo/ui/shadcn/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/shadcn/avatar";
import { UserCog, X, Check, Loader2 } from "lucide-react";
import { cn } from "@repo/lib/cn";

const STORAGE_KEY = "impersonation";

interface MemberUser {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  image_url?: string | null;
}

function getDisplayName(m: MemberUser): string {
  const parts = [m.first_name, m.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : m.user_id;
}

function getInitials(m: MemberUser): string {
  const first = m.first_name?.[0] ?? "";
  const last = m.last_name?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

function readStorage(): { userId: string; name: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.userId) return parsed;
  } catch {}
  return null;
}

function writeStorage(userId: string, name: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, name }));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function ImpersonationSwitcher() {
  const [impersonation, setImpersonationState] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setImpersonationState(readStorage());
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/org/members", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch members");
      const json = (await res.json()) as {
        members?: MemberUser[];
      };
      setMembers(json.members ?? []);
    } catch (err) {
      console.error("Impersonation: failed to load members", err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadMembers();
  }, [open, loadMembers]);

  const isImpersonating = impersonation !== null;

  const handleSelect = (member: MemberUser) => {
    const name = getDisplayName(member);
    writeStorage(member.user_id, name);
    setImpersonationState({ userId: member.user_id, name });
    setOpen(false);
  };

  const handleClear = () => {
    clearStorage();
    setImpersonationState(null);
  };

  return (
    <div className="flex items-center gap-2">
      {isImpersonating && (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="gap-1 text-xs">
            <UserCog className="h-3 w-3" />
            Viewing as: {impersonation.name}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserCog className="h-4 w-4" />
            {isImpersonating ? "Switch User" : "Impersonate"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search members..." />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>No members found.</CommandEmpty>
                  <CommandGroup heading="Organization Members">
                    {members.map((member) => {
                      const name = getDisplayName(member);
                      const isSelected =
                        impersonation?.userId === member.user_id;
                      return (
                        <CommandItem
                          key={member.id}
                          value={`${name} ${member.email ?? ""} ${member.id}`}
                          onSelect={() => handleSelect(member)}
                          className="flex items-center gap-2.5 py-2 px-2"
                        >
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={member.image_url ?? undefined} alt={name} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span
                              className={cn(
                                "truncate text-sm leading-tight",
                                isSelected && "font-medium"
                              )}
                            >
                              {name}
                            </span>
                            {member.email && (
                              <span className="truncate text-xs text-muted-foreground leading-tight">
                                {member.email}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
