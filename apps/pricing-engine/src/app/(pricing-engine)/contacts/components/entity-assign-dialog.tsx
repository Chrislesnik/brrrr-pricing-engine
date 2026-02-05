"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/shadcn/dialog"
import { Button } from "@repo/ui/shadcn/button"
import { Input } from "@repo/ui/shadcn/input"
import { Badge } from "@repo/ui/shadcn/badge"
import { IconX } from "@tabler/icons-react"

interface Member {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
}

export function EntityAssignMembersDialog({
  entityId,
  open,
  onOpenChange,
}: {
  entityId: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [members, setMembers] = React.useState<Member[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [editable, setEditable] = React.useState<boolean>(true)
  const [query, setQuery] = React.useState<string>("")

  React.useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const aRes = await fetch(`/api/applicants/entities/${entityId}/assignees`, { cache: "no-store" })
        const aJson = (await aRes.json().catch(() => ({}))) as { userIds: string[] }
        const assignedIds = (aJson.userIds ?? []).filter(Boolean)
        const mRes = await fetch(
          `/api/org/members?includeUserIds=${encodeURIComponent(assignedIds.join(","))}&includeMemberIds=${encodeURIComponent(
            assignedIds.join(",")
          )}`,
          { cache: "no-store" }
        )
        const mJson = (await mRes.json().catch(() => ({}))) as { members: Member[]; editable?: boolean }
        if (!active) return
        setMembers(mJson.members ?? [])
        if (typeof mJson.editable === "boolean") setEditable(mJson.editable)
        setSelected(new Set(assignedIds))
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (active) setLoading(false)
      }
    }
    if (open) void load()
    return () => {
      active = false
    }
  }, [entityId, open])

  function addUser(id: string) {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function removeUser(id: string) {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function save() {
    setError(null)
    try {
      const res = await fetch(`/api/applicants/entities/${entityId}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      if (!res.ok) throw new Error(await res.text())
      onOpenChange(false)
      window.dispatchEvent(new Event("app:entities:changed"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    }
  }

  // Compute filtered suggestion list excluding already-selected members
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = members.filter((m) => !selected.has(m.id))
    if (!q) return list
    return list.filter((m) => {
      const name = [m.first_name, m.last_name].filter(Boolean).join(" ").toLowerCase()
      return name.includes(q) || String(m.user_id).toLowerCase().includes(q) || String(m.id).toLowerCase().includes(q)
    })
  }, [members, selected, query])

  const fullName = (m: Member) => [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.user_id || m.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign members</DialogTitle>
          <DialogDescription>Select organization members to assign to this entity.</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((uid) => {
              const m = members.find((x) => x.id === uid || x.user_id === uid)
              const label = m ? fullName(m) : uid
              return (
                <Badge key={uid} variant="outline" className="flex items-center gap-2">
                  <span className="text-sm">{label}</span>
                  {editable ? (
                    <button
                      type="button"
                      className="rounded-md p-0.5 hover:bg-muted"
                      onClick={() => removeUser(uid)}
                      aria-label={`Remove ${label}`}
                    >
                      <IconX className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </Badge>
              )
            })}
            {selected.size === 0 ? (
              <span className="text-xs text-muted-foreground">No members selected.</span>
            ) : null}
          </div>

          {/* Search and suggestions */}
          <div className="space-y-2">
            <Input
              placeholder={editable ? "Search members..." : "View only"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!editable}
            />
            <div className="max-h-48 overflow-auto rounded-md border">
              {members.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">{loading ? "Loading..." : "No members found."}</p>
              ) : filtered.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">No matches.</p>
              ) : (
                filtered.map((m) => {
                  const name = fullName(m)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => addUser(m.id)}
                      disabled={!editable}
                    >
                      {name}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {editable ? (
            <Button onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}


