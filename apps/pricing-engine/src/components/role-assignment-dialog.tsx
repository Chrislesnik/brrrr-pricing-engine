"use client"

import * as React from "react"
import { Button } from "@repo/ui/shadcn/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/shadcn/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/shadcn/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/shadcn/command"
import { ChevronsUpDown, X, Plus } from "lucide-react"
import { cn } from "@repo/lib/cn"

type RoleType = {
  id: number
  code: string
  name: string
}

type Member = {
  id: string
  user_id: string
  first_name?: string | null
  last_name?: string | null
}

type RoleAssignment = {
  id: number
  role_type_id: number
  role_name: string
  role_code: string
  user_id: string
  first_name: string | null
  last_name: string | null
}

interface RoleAssignmentDialogProps {
  resourceType: "deal" | "loan" | "borrower" | "entity" | "deal_task"
  resourceId: string
  open: boolean
  onOpenChange: (next: boolean) => void
  onSaved?: () => void
}

/* -------------------------------------------------------------------------- */
/*  Searchable Role Select                                                     */
/* -------------------------------------------------------------------------- */

function SearchableRoleSelect({
  roles,
  value,
  onValueChange,
  disabled = false,
}: {
  roles: RoleType[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selectedLabel = roles.find((r) => String(r.id) === value)?.name

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {selectedLabel || "Select role"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {roles.map((r) => (
                <CommandItem
                  key={r.id}
                  value={r.name}
                  onSelect={() => {
                    onValueChange(String(r.id))
                    setOpen(false)
                  }}
                >
                  {r.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------------------------------------------------------- */
/*  Searchable Member Select                                                   */
/* -------------------------------------------------------------------------- */

function SearchableMemberSelect({
  members,
  value,
  onValueChange,
  loading = false,
  disabled = false,
  initialLabel,
}: {
  members: Member[]
  value: string
  onValueChange: (value: string) => void
  loading?: boolean
  disabled?: boolean
  initialLabel?: string | null
}) {
  const [open, setOpen] = React.useState(false)
  const fullName = (m: { first_name?: string | null; last_name?: string | null; user_id?: string }) =>
    [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.user_id || "Unknown"
  const selectedMember = members.find((m) => m.user_id === value)
  const selectedLabel = selectedMember ? fullName(selectedMember) : (initialLabel || null)

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className="w-full justify-between font-normal h-9 text-sm"
        >
          <span className={cn("truncate", !selectedLabel && "text-muted-foreground")}>
            {loading ? "Loading..." : selectedLabel || "Select member"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList className="max-h-48 overflow-y-auto">
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {members.map((m) => (
                <CommandItem
                  key={m.user_id}
                  value={m.user_id}
                  keywords={[fullName(m)]}
                  onSelect={() => {
                    onValueChange(m.user_id)
                    setOpen(false)
                  }}
                >
                  {fullName(m)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------------------------------------------------------- */
/*  Assignment Row (existing saved row — editable inline)                      */
/* -------------------------------------------------------------------------- */

function AssignmentRow({
  assignment,
  roles,
  onRemove,
  onUpdate,
  isExternal,
}: {
  assignment: RoleAssignment
  roles: RoleType[]
  onRemove: () => void
  onUpdate: (roleTypeId: number, userId: string) => void
  isExternal: boolean
}) {
  const availableRoles = isExternal ? roles.filter((r) => r.id === 4) : roles
  const assignmentFullName = [assignment.first_name, assignment.last_name].filter(Boolean).join(" ").trim() || assignment.user_id

  // Seed the members list with the currently-assigned user so the label shows immediately
  const seedMember: Member = {
    id: assignment.user_id,
    user_id: assignment.user_id,
    first_name: assignment.first_name,
    last_name: assignment.last_name,
  }
  const [members, setMembers] = React.useState<Member[]>([seedMember])
  const [membersLoading, setMembersLoading] = React.useState(false)

  const loadMembers = React.useCallback(async (roleTypeId: number) => {
    setMembersLoading(true)
    try {
      // Only pass roleTypeId for Broker role (cross-org lookup); otherwise use standard pool
      const params = new URLSearchParams()
      if (roleTypeId === 4) params.set("roleTypeId", String(roleTypeId))
      const res = await fetch(`/api/org/members?${params.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as { members: Member[] }
      const fetched = json.members ?? []
      // Dedup by user_id and ensure the current assignment user is always in the list
      const seen = new Set<string>()
      const deduped: Member[] = []
      const hasCurrentUser = fetched.some((m) => m.user_id === assignment.user_id)
      if (!hasCurrentUser) {
        seen.add(seedMember.user_id)
        deduped.push(seedMember)
      }
      for (const m of fetched) {
        if (seen.has(m.user_id)) continue
        seen.add(m.user_id)
        deduped.push(m)
      }
      setMembers(deduped)
    } catch {
      // Keep the seed member on error
    } finally {
      setMembersLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.user_id])

  React.useEffect(() => {
    void loadMembers(assignment.role_type_id)
  }, [assignment.role_type_id, loadMembers])

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchableRoleSelect
          roles={availableRoles}
          value={String(assignment.role_type_id)}
          onValueChange={(val) => onUpdate(parseInt(val, 10), assignment.user_id)}
        />
      </div>
      <div className="flex-1">
        <SearchableMemberSelect
          members={members}
          value={assignment.user_id}
          loading={membersLoading}
          initialLabel={assignmentFullName}
          onValueChange={(val) => onUpdate(assignment.role_type_id, val)}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  New Assignment Row (unsaved — pick role + member, then auto-saves)         */
/* -------------------------------------------------------------------------- */

function NewAssignmentRow({
  roles,
  isExternal,
  onSave,
  onCancel,
}: {
  roles: RoleType[]
  isExternal: boolean
  onSave: (roleTypeId: number, userId: string) => Promise<void>
  onCancel: () => void
}) {
  const availableRoles = isExternal ? roles.filter((r) => r.id === 4) : roles
  const [selectedRoleId, setSelectedRoleId] = React.useState("")
  const [selectedUserId, setSelectedUserId] = React.useState("")
  const [members, setMembers] = React.useState<Member[]>([])
  const [membersLoading, setMembersLoading] = React.useState(false)

  const loadMembers = React.useCallback(async (roleTypeId: string) => {
    setMembersLoading(true)
    try {
      // Only pass roleTypeId for Broker role (id=4) for cross-org lookup
      const params = new URLSearchParams()
      if (roleTypeId === "4") params.set("roleTypeId", roleTypeId)
      const res = await fetch(`/api/org/members?${params.toString()}`)
      if (!res.ok) return
      const json = (await res.json()) as { members: Member[] }
      setMembers(json.members ?? [])
    } catch {
      // non-critical
    } finally {
      setMembersLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (selectedRoleId) {
      setSelectedUserId("")
      void loadMembers(selectedRoleId)
    }
  }, [selectedRoleId, loadMembers])

  // Auto-save when both are selected
  React.useEffect(() => {
    if (selectedRoleId && selectedUserId) {
      void onSave(parseInt(selectedRoleId, 10), selectedUserId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId, selectedUserId])

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchableRoleSelect
          roles={availableRoles}
          value={selectedRoleId}
          onValueChange={setSelectedRoleId}
        />
      </div>
      <div className="flex-1">
        <SearchableMemberSelect
          members={members}
          value={selectedUserId}
          loading={membersLoading}
          disabled={!selectedRoleId}
          onValueChange={setSelectedUserId}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onCancel}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Dialog                                                                */
/* -------------------------------------------------------------------------- */

export function RoleAssignmentDialog({
  resourceType,
  resourceId,
  open,
  onOpenChange,
  onSaved,
}: RoleAssignmentDialogProps) {
  const [assignments, setAssignments] = React.useState<RoleAssignment[]>([])
  const [roleTypes, setRoleTypes] = React.useState<RoleType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isExternal, setIsExternal] = React.useState(false)
  const [addingRow, setAddingRow] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [aRes, rRes, mRes] = await Promise.all([
        fetch(`/api/role-assignments?resource_type=${encodeURIComponent(resourceType)}&resource_id=${encodeURIComponent(resourceId)}`),
        fetch("/api/deal-role-types"),
        fetch("/api/org/members"),
      ])
      if (!aRes.ok) throw new Error(await aRes.text())
      if (!rRes.ok) throw new Error(await rRes.text())
      const aJson = (await aRes.json()) as { assignments: RoleAssignment[] }
      const rJson = (await rRes.json()) as { roles: RoleType[] }
      setAssignments(aJson.assignments ?? [])
      setRoleTypes(rJson.roles ?? [])
      if (mRes.ok) {
        const mJson = (await mRes.json()) as { editable?: boolean }
        setIsExternal(mJson.editable === false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [resourceType, resourceId])

  React.useEffect(() => {
    if (open) {
      void load()
      setAddingRow(false)
    }
  }, [open, load])

  const handleAddAssignment = async (roleTypeId: number, userId: string) => {
    setError(null)
    try {
      const res = await fetch("/api/role-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId,
          role_type_id: roleTypeId,
          user_id: userId,
        }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Failed to assign" }))
        throw new Error((errJson as { error?: string }).error || "Failed to assign")
      }
      const { assignment } = (await res.json()) as { assignment: RoleAssignment }
      setAssignments((prev) => [...prev, assignment])
      setAddingRow(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign")
    }
  }

  const handleRemoveAssignment = async (assignmentId: number) => {
    setError(null)
    try {
      const res = await fetch(`/api/role-assignments/${assignmentId}`, { method: "DELETE" })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Failed to remove" }))
        throw new Error((errJson as { error?: string }).error || "Failed to remove")
      }
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove")
    }
  }

  const handleUpdateAssignment = async (
    assignmentId: number,
    newRoleTypeId: number,
    newUserId: string
  ) => {
    // Delete old, create new
    setError(null)
    try {
      await fetch(`/api/role-assignments/${assignmentId}`, { method: "DELETE" })
      const res = await fetch("/api/role-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId,
          role_type_id: newRoleTypeId,
          user_id: newUserId,
        }),
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: "Failed to update" }))
        throw new Error((errJson as { error?: string }).error || "Failed to update")
      }
      const { assignment } = (await res.json()) as { assignment: RoleAssignment }
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? assignment : a))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update")
      // Reload to get correct state
      void load()
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    if (onSaved) onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Add roles and assign members to this {resourceType.replace("_", " ")}.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading...</p>
          ) : (
            <>
              {assignments.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  roles={roleTypes}
                  isExternal={isExternal}
                  onRemove={() => void handleRemoveAssignment(a.id)}
                  onUpdate={(roleTypeId, userId) =>
                    void handleUpdateAssignment(a.id, roleTypeId, userId)
                  }
                />
              ))}

              {addingRow && (
                <NewAssignmentRow
                  roles={roleTypes}
                  isExternal={isExternal}
                  onSave={handleAddAssignment}
                  onCancel={() => setAddingRow(false)}
                />
              )}

              {assignments.length === 0 && !addingRow && (
                <p className="text-sm text-muted-foreground py-2">No roles assigned yet.</p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingRow(true)}
            disabled={addingRow || loading}
            className="gap-1 text-xs text-muted-foreground"
          >
            <Plus className="size-3" />
            Add Role
          </Button>
          <Button variant="default" size="sm" onClick={handleClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
