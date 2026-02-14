"use client";

import { useState, useEffect } from "react";
// import { useSupabase } from "@/hooks/use-supabase"; // TODO: Implement useSupabase hook
// import { useImpersonation } from "@/contexts/impersonation-context"; // TODO: Implement ImpersonationContext
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
import { UserCog, X, Check } from "lucide-react";
import { cn } from "@repo/lib/cn";

interface User {
  id: number;
  full_name: string | null;
  email: string | null;
}

export function ImpersonationSwitcher() {
  // Mock hooks for now until implemented
  const supabase = null as any; 
  const { impersonatedUserId, impersonatedUserName, setImpersonation, clearImpersonation, isImpersonating } = {
    impersonatedUserId: null,
    impersonatedUserName: null,
    setImpersonation: (id: any, name: any) => {},
    clearImpersonation: () => {},
    isImpersonating: false
  };
  
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (supabase && open) {
      loadUsers();
    }
  }, [supabase, open]);

  const loadUsers = async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from("auth_clerk_users")
      .select("id, full_name, email")
      .order("full_name");

    setUsers(data || []);
  };

  const handleSelectUser = (user: User) => {
    setImpersonation(user.id, user.full_name || user.email || "Unknown");
    setOpen(false);
    // Reload the page to fetch data as the impersonated user
    window.location.reload();
  };

  const handleClearImpersonation = () => {
    clearImpersonation();
    // Reload to go back to own data
    window.location.reload();
  };

  if (!isImpersonating && !open) {
      // If not impersonating and popover closed, maybe show nothing or just the button?
      // Logic depends on requirements. For now, render button.
  }

  return (
    <div className="flex items-center gap-2">
      {isImpersonating && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <UserCog className="h-3 w-3" />
            Viewing as: {impersonatedUserName}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearImpersonation}
            className="h-7 px-2"
          >
            <X className="h-4 w-4" />
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
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.full_name} ${user.email}`}
                    onSelect={() => handleSelectUser(user)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        impersonatedUserId === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name || "Unnamed"}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
