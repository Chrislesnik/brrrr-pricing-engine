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

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mRes, aRes] = await Promise.all([
        fetch("/api/org/members", { method: "GET" }),
        fetch(`/api/loans/${loanId}/assignees`, { method: "GET" }),
      ])
      if (!mRes.ok) throw new Error(await mRes.text())
      if (!aRes.ok) throw new Error(await aRes.text())
      const mJson = (await mRes.json()) as { members: Member[] }
      const aJson = (await aRes.json()) as { userIds: string[] }
      setMembers(mJson.members ?? [])
      setSelected(new Set((aJson.userIds ?? []).filter(Boolean)))
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
        <div className="max-h-80 space-y-2 overflow-auto pr-1">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{loading ? "Loading..." : "No members found."}</p>
          ) : (
            members.map((m) => {
              const id = `member-${m.user_id}`
              const isChecked = selected.has(m.user_id)
              return (
                <label key={m.user_id} htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted">
                  <Checkbox
                    id={id}
                    checked={isChecked}
                    onCheckedChange={(v) => toggle(m.user_id, Boolean(v))}
                  />
                  <span className="text-sm">{fullName(m)}</span>
                </label>
              )
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


