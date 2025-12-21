"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Member {
  user_id: string
  first_name: string | null
  last_name: string | null
}

export function BorrowerAssignMembersDialog({
  borrowerId,
  open,
  onOpenChange,
}: {
  borrowerId: string
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [members, setMembers] = React.useState<Member[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    async function load() {
      setError(null)
      try {
        const aRes = await fetch(`/api/applicants/borrowers/${borrowerId}/assignees`, { cache: "no-store" })
        const aJson = (await aRes.json().catch(() => ({}))) as { userIds: string[] }
        const assignedIds = (aJson.userIds ?? []).filter(Boolean)
        const mRes = await fetch(`/api/org/members`, { cache: "no-store" })
        const mJson = (await mRes.json().catch(() => ({}))) as { members: Member[] }
        if (!active) return
        setMembers(mJson.members ?? [])
        setSelected(new Set(assignedIds))
      } catch (e) {
        if (!active) return
        setError(e instanceof Error ? e.message : "Failed to load")
      }
    }
    if (open) void load()
    return () => {
      active = false
    }
  }, [borrowerId, open])

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function save() {
    setError(null)
    try {
      const res = await fetch(`/api/applicants/borrowers/${borrowerId}/assignees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selected) }),
      })
      if (!res.ok) throw new Error(await res.text())
      onOpenChange(false)
      window.dispatchEvent(new Event("app:borrowers:changed"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign members</DialogTitle>
          <DialogDescription>Select organization members to assign to this borrower.</DialogDescription>
        </DialogHeader>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="max-h-64 overflow-y-auto space-y-2">
          {members.map((m) => {
            const id = m.user_id
            const name = [m.first_name, m.last_name].filter(Boolean).join(" ") || id
            const checked = selected.has(id)
            return (
              <label key={id} className="flex items-center gap-2">
                <Checkbox checked={checked} onCheckedChange={(c) => toggle(id, Boolean(c))} />
                <span>{name}</span>
              </label>
            )
          })}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


