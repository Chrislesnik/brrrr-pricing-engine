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
  resourceType: "deal" | "loan" | "borrower" | "entity" | "deal_task" | "broker_org" | "appraisal"
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
  members,
  brokerMembers,
  onRemove,
  onUpdate,
  isExternal,
}: {
  assignment: RoleAssignment
  roles: RoleType[]
  members: Member[]
  brokerMembers: Member[]
  onRemove: () => void
  onUpdate: (roleTypeId: number, userId: string) => void
  isExternal: boolean
}) {
  const availableRoles = isExternal ? roles.filter((r) => r.id === 4) : roles
  const assignmentFullName = [assignment.first_name, assignment.last_name].filter(Boolean).join(" ").trim() || assignment.user_id

  // Use broker members pool for Broker role, standard pool for everything else
  const pool = assignment.role_type_id === 4 ? brokerMembers : members
  // Ensure the current assignment user is always in the list
  const hasCurrentUser = pool.some((m) => m.user_id === assignment.user_id)
  const membersWithCurrent = hasCurrentUser
    ? pool
    : [{ id: assignment.user_id, user_id: assignment.user_id, first_name: assignment.first_name, last_name: assignment.last_name }, ...pool]

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
          members={membersWithCurrent}
          value={assignment.user_id}
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
/*  New Assignment Row (local draft — pick role + member, commits to draft)    */
/* -------------------------------------------------------------------------- */

function NewAssignmentRow({
  roles,
  members,
  brokerMembers,
  isExternal,
  onCommit,
  onCancel,
}: {
  roles: RoleType[]
  members: Member[]
  brokerMembers: Member[]
  isExternal: boolean
  onCommit: (roleTypeId: number, userId: string) => void
  onCancel: () => void
}) {
  const availableRoles = isExternal ? roles.filter((r) => r.id === 4) : roles
  const [selectedRoleId, setSelectedRoleId] = React.useState("")
  const [selectedUserId, setSelectedUserId] = React.useState("")

  // Use broker pool when Broker role is selected, standard pool otherwise
  const pool = selectedRoleId === "4" ? brokerMembers : members

  // Commit to draft when both are selected
  React.useEffect(() => {
    if (selectedRoleId && selectedUserId) {
      onCommit(parseInt(selectedRoleId, 10), selectedUserId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId, selectedUserId])

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <SearchableRoleSelect
          roles={availableRoles}
          value={selectedRoleId}
          onValueChange={(val) => {
            setSelectedRoleId(val)
            setSelectedUserId("")
          }}
        />
      </div>
      <div className="flex-1">
        <SearchableMemberSelect
          members={pool}
          value={selectedUserId}
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

// A draft assignment can be a server-backed row (positive id) or a local-only
// row (negative temporary id).
type DraftAssignment = RoleAssignment & { _isNew?: boolean }

let _tmpId = 0
function nextTmpId() {
  _tmpId -= 1
  return _tmpId
}

export function RoleAssignmentDialog({
  resourceType,
  resourceId,
  open,
  onOpenChange,
  onSaved,
}: RoleAssignmentDialogProps) {
  // Server-truth (loaded on open)
  const [serverAssignments, setServerAssignments] = React.useState<RoleAssignment[]>([])

  // Local draft the user manipulates
  const [draft, setDraft] = React.useState<DraftAssignment[]>([])

  const [roleTypes, setRoleTypes] = React.useState<RoleType[]>([])
  const [allMembers, setAllMembers] = React.useState<Member[]>([])
  const [brokerMembers, setBrokerMembers] = React.useState<Member[]>([])
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isExternal, setIsExternal] = React.useState(false)
  const [addingRow, setAddingRow] = React.useState(false)

  // Detect whether the draft differs from the server state
  const isDirty = React.useMemo(() => {
    if (draft.length !== serverAssignments.length) return true
    const serverMap = new Map(serverAssignments.map((a) => [a.id, a]))
    return draft.some((d) => {
      if (d._isNew) return true
      const s = serverMap.get(d.id)
      if (!s) return true
      return s.role_type_id !== d.role_type_id || s.user_id !== d.user_id
    })
  }, [draft, serverAssignments])

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
      const loaded = aJson.assignments ?? []
      setServerAssignments(loaded)
      setDraft(loaded.map((a) => ({ ...a })))
      setRoleTypes(rJson.roles ?? [])
      if (mRes.ok) {
        const mJson = (await mRes.json()) as { members: Member[]; editable?: boolean }
        setAllMembers(mJson.members ?? [])
        setIsExternal(mJson.editable === false)
      }
      fetch("/api/org/members?roleTypeId=4").then(async (bRes) => {
        if (bRes.ok) {
          const bJson = (await bRes.json()) as { members: Member[] }
          setBrokerMembers(bJson.members ?? [])
        }
      }).catch(() => {})
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

  /* ---- Draft manipulation (local only, no API calls) ---- */

  const handleDraftRemove = (id: number) => {
    setDraft((prev) => prev.filter((a) => a.id !== id))
  }

  const handleDraftUpdate = (id: number, roleTypeId: number, userId: string) => {
    setDraft((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const role = roleTypes.find((r) => r.id === roleTypeId)
        const member = [...allMembers, ...brokerMembers].find((m) => m.user_id === userId)
        return {
          ...a,
          role_type_id: roleTypeId,
          role_name: role?.name ?? a.role_name,
          role_code: role?.code ?? a.role_code,
          user_id: userId,
          first_name: member?.first_name ?? a.first_name,
          last_name: member?.last_name ?? a.last_name,
        }
      })
    )
  }

  const handleDraftAdd = (roleTypeId: number, userId: string) => {
    const role = roleTypes.find((r) => r.id === roleTypeId)
    const member = [...allMembers, ...brokerMembers].find((m) => m.user_id === userId)
    const newRow: DraftAssignment = {
      id: nextTmpId(),
      role_type_id: roleTypeId,
      role_name: role?.name ?? "",
      role_code: role?.code ?? "",
      user_id: userId,
      first_name: member?.first_name ?? null,
      last_name: member?.last_name ?? null,
      _isNew: true,
    }
    setDraft((prev) => [...prev, newRow])
    setAddingRow(false)
  }

  /* ---- Save: reconcile draft with server ---- */

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const serverIds = new Set(serverAssignments.map((a) => a.id))
      const draftIds = new Set(draft.filter((d) => !d._isNew).map((d) => d.id))

      // Deletions: server rows no longer in draft
      const toDelete = serverAssignments.filter((a) => !draftIds.has(a.id))
      // Additions: draft rows marked _isNew
      const toAdd = draft.filter((d) => d._isNew)
      // Updates: draft rows that exist on server but changed role/user
      const toUpdate = draft.filter((d) => {
        if (d._isNew) return false
        const s = serverAssignments.find((a) => a.id === d.id)
        if (!s) return false
        return s.role_type_id !== d.role_type_id || s.user_id !== d.user_id
      })

      // Execute deletions
      await Promise.all(
        [...toDelete, ...toUpdate].map((a) =>
          fetch(`/api/role-assignments/${a.id}`, { method: "DELETE" })
        )
      )

      // Execute additions + updated rows (re-created)
      await Promise.all(
        [...toAdd, ...toUpdate].map((a) =>
          fetch("/api/role-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resource_type: resourceType,
              resource_id: resourceId,
              role_type_id: a.role_type_id,
              user_id: a.user_id,
            }),
          })
        )
      )

      onOpenChange(false)
      if (onSaved) onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
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
              {draft.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  roles={roleTypes}
                  members={allMembers}
                  brokerMembers={brokerMembers}
                  isExternal={isExternal}
                  onRemove={() => handleDraftRemove(a.id)}
                  onUpdate={(roleTypeId, userId) =>
                    handleDraftUpdate(a.id, roleTypeId, userId)
                  }
                />
              ))}

              {addingRow && (
                <NewAssignmentRow
                  roles={roleTypes}
                  members={allMembers}
                  brokerMembers={brokerMembers}
                  isExternal={isExternal}
                  onCommit={handleDraftAdd}
                  onCancel={() => setAddingRow(false)}
                />
              )}

              {draft.length === 0 && !addingRow && (
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
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={loading || saving || !isDirty}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
