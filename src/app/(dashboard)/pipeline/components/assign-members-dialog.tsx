"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IconX } from "@tabler/icons-react"

type Member = { user_id: string; first_name?: string | null; last_name?: string | null }

interface Props {
  loanId: string
  open: boolean
  onOpenChange: (next: boolean) => void
  onSaved?: () => void
}

export function AssignMembersDialog({ loanId, open, onOpenChange, onSaved }: Props) {
  const [members, setMembers] = React.useState<Member[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [editable, setEditable] = React.useState(true)
  const [query, setQuery] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const aRes = await fetch(`/api/loans/${loanId}/assignees`, { method: "GET" })
      if (!aRes.ok) throw new Error(await aRes.text())
      const aJson = (await aRes.json()) as { userIds: string[] }
      const assignedIds = (aJson.userIds ?? []).filter(Boolean)
      const mRes = await fetch(
        `/api/org/members?loanId=${encodeURIComponent(loanId)}&includeUserIds=${encodeURIComponent(
          assignedIds.join(",")
        )}`,
        { method: "GET" }
      )
      if (!mRes.ok) throw new Error(await mRes.text())
      if (!aRes.ok) throw new Error(await aRes.text())
      const mJson = (await mRes.json()) as { members: Member[]; editable?: boolean }
      setMembers(mJson.members ?? [])
      if (typeof mJson.editable === "boolean") setEditable(mJson.editable)
      setSelected(new Set(assignedIds))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [loanId])

  React.useEffect(() => {
    if (open) void load()
  }, [open, load])

  const toggle = (userId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(userId)
      else next.delete(userId)
      return next
    })
  }

  const addUser = (userId: string) => {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    setQuery("")
  }

  const removeUser = (userId: string) => {
    if (!editable) return
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = members.filter((m) => !selected.has(m.user_id))
    if (!q) return list
    return list.filter((m) => {
      const name = [m.first_name, m.last_name].filter(Boolean).join(" ").toLowerCase()
      return name.includes(q) || String(m.user_id).toLowerCase().includes(q)
    })
  }, [members, selected, query])

  const onSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/loans/${loanId}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      if (!res.ok) throw new Error(await res.text())
      onOpenChange(false)
      // Dispatch a global event so tables can update row values and refresh filters without reload
      try {
        const names = members
          .filter((m) => selected.has(m.user_id))
          .map((m) => [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.user_id)
          .join(", ")
        window.dispatchEvent(
          new CustomEvent("loan-assignees-updated", {
            detail: { id: loanId, userIds: Array.from(selected), assignedTo: names },
          })
        )
      } catch {
        // ignore event errors
      }
      if (onSaved) onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setLoading(false)
    }
  }

  const fullName = (m: Member) => [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.user_id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign members</DialogTitle>
          <DialogDescription>Select organization members to assign to this loan.</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {/* Selected chips */}
          <div className="flex flex-wrap gap-2">
            {Array.from(selected).map((uid) => {
              const m = members.find((x) => x.user_id === uid)
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
                      key={m.user_id}
                      type="button"
                      className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => addUser(m.user_id)}
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {editable ? (
            <Button onClick={onSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


