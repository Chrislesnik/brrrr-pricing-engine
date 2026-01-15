"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Link2, Mail, Unlink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Guarantor = { id?: string | null; name?: string | null; email?: string | null }

interface Props {
  loanId: string
  showBorrowerEntity?: boolean
  initialEntityId?: string | null
  initialEntityName?: string | null
  initialGuarantors?: Guarantor[]
  maxGuarantors?: number
  onChange?: (next: { entityId?: string | null; entityName?: string | null; guarantors?: Guarantor[] }) => void
}

export function ApplicationPartyEditor({
  loanId,
  showBorrowerEntity = true,
  initialEntityId,
  initialEntityName,
  initialGuarantors = [],
  maxGuarantors = 4,
  onChange,
}: Props) {
  // Entity state
  const [entityId, setEntityId] = useState<string | null | undefined>(initialEntityId ?? null)
  const [entityName, setEntityName] = useState<string>(initialEntityName ?? "")
  const [entityInput, setEntityInput] = useState<string>("")
  const [editingEntity, setEditingEntity] = useState(false)
  const [entitySuggestions, setEntitySuggestions] = useState<Array<{ id: string; name: string; display: string }>>([])
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false)
  const [entityLoading, setEntityLoading] = useState(false)

  // Guarantors
  const [guarantors, setGuarantors] = useState<Guarantor[]>(() =>
    (initialGuarantors ?? []).map((g) => ({ id: g.id ?? null, name: g.name ?? "", email: g.email ?? null }))
  )
  const [editingGuarantorKey, setEditingGuarantorKey] = useState<string | null>(null) // `${idx}`
  const [guarantorInput, setGuarantorInput] = useState("")
  const [guarantorSuggestions, setGuarantorSuggestions] = useState<
    Array<{ id: string; name: string; display: string; email?: string | null }>
  >([])
  const [showGuarantorSuggestions, setShowGuarantorSuggestions] = useState(false)
  const [guarantorLoading, setGuarantorLoading] = useState(false)
  const [guarantorEmailStatus, setGuarantorEmailStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({})
  const [signedEmails, setSignedEmails] = useState<Set<string>>(new Set())
  const [signingLoaded, setSigningLoaded] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ idx: number; email: string | null } | null>(null)

  useEffect(() => {
    setEntityId(initialEntityId ?? null)
    setEntityName(initialEntityName ?? "")
    setEntityInput(initialEntityName ?? "")
  }, [initialEntityId, initialEntityName])

  useEffect(() => {
    setGuarantors((initialGuarantors ?? []).map((g) => ({ id: g.id ?? null, name: g.name ?? "", email: g.email ?? null })))
  }, [initialGuarantors])

  // Entity suggestions
  useEffect(() => {
    let cancelled = false
    if (!showEntitySuggestions) {
      setEntitySuggestions([])
      return
    }
    const q = entityInput && entityInput.trim().length > 0 ? entityInput.trim() : "*"
    const ctrl = new AbortController()
    setEntityLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/applicants/entities?q=${encodeURIComponent(q)}`, { cache: "no-store", signal: ctrl.signal })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as { entities?: Array<{ id: string; display_id?: string; entity_name?: string }> }
        if (cancelled) return
        const opts =
          (j.entities ?? []).slice(0, 20).map((e) => ({
            id: e.id as string,
            name: (e.entity_name ?? "") as string,
            display: `${(e.display_id ?? "") as string} ${(e.entity_name ?? "") as string}`.trim(),
          })) ?? []
        setEntitySuggestions(opts)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setEntityLoading(false)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [entityInput, showEntitySuggestions])

  // Guarantor suggestions
  useEffect(() => {
    let cancelled = false
    if (!showGuarantorSuggestions) {
      setGuarantorSuggestions([])
      return
    }
    const q = guarantorInput && guarantorInput.trim().length > 0 ? guarantorInput.trim() : "*"
    const ctrl = new AbortController()
    setGuarantorLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/applicants/borrowers?q=${encodeURIComponent(q)}`, { cache: "no-store", signal: ctrl.signal })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as { borrowers?: Array<{ id: string; first_name?: string; last_name?: string; email?: string | null }> }
        if (cancelled) return
        const existingIds = new Set(guarantors.map((g) => g.id).filter(Boolean) as string[])
        const opts =
          (j.borrowers ?? [])
            .filter((b) => !existingIds.has(b.id))
            .slice(0, 20)
            .map((b) => ({
              id: b.id as string,
              name: [b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim(),
              display: `${[b.first_name ?? "", b.last_name ?? ""].filter(Boolean).join(" ").trim()} ${(b.email ?? "").trim()}`.trim(),
              email: (b.email as string) ?? null,
            })) ?? []
        setGuarantorSuggestions(opts)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setGuarantorLoading(false)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [guarantorInput, showGuarantorSuggestions, guarantors])

  const totalGuarantors = guarantors.length

  // Fetch signed emails for this loan (reuse every time component mounts; could be refreshed if needed)
  useEffect(() => {
    let cancelled = false
    const ctrl = new AbortController()
    setSigningLoaded(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/applications/progress?loanId=${encodeURIComponent(loanId)}`, { cache: "no-store", signal: ctrl.signal })
        if (!res.ok) return
        const j = (await res.json().catch(() => ({}))) as {
          rows?: Array<{ loan_id: string; signingEmails?: string[] }>
        }
        if (cancelled) return
        const match = j.rows?.find((r) => r.loan_id === loanId)
        if (match?.signingEmails?.length) {
          setSignedEmails(new Set(match.signingEmails.map((e) => (e ?? "").toLowerCase()).filter((e) => e.length > 0)))
        } else {
          setSignedEmails(new Set())
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSigningLoaded(true)
      }
    })()
    return () => {
      cancelled = true
      ctrl.abort()
    }
  }, [loanId])

  const persistEntity = async (id: string | undefined | null, name: string | undefined | null) => {
    try {
      await fetch(`/api/applications/${loanId}/entity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_id: id ?? null,
          borrower_name: name ?? null,
        }),
      })
      onChange?.({ entityId: id ?? null, entityName: name ?? null, guarantors })
    } catch {
      // ignore
    }
  }

  const persistGuarantors = async (list: Guarantor[]) => {
    try {
      const guarantor_ids = list.map((g) => g.id ?? null)
      const guarantor_names = list.map((g) => (g.name ? g.name : null))
      const guarantor_emails = list.map((g) => (g.email ? g.email : null))
      await fetch(`/api/applications/${loanId}/guarantors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guarantor_ids, guarantor_names, guarantor_emails }),
      })
      onChange?.({ entityId, entityName, guarantors: list })
    } catch {
      // ignore
    }
  }

  const addGuarantor = () => {
    if (guarantors.length >= maxGuarantors) return
    setGuarantors((prev) => [...prev, { id: null, name: "", email: "" }])
    setEditingGuarantorKey(`${guarantors.length}`)
    setGuarantorInput("")
    setShowGuarantorSuggestions(true)
  }

  const removeGuarantor = (idx: number) => {
    setGuarantors((prev) => {
      const next = [...prev]
      next.splice(idx, 1)
      void persistGuarantors(next)
      return next
    })
  }

  const linkedEntityIcon = entityId ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Unlink className="h-4 w-4" aria-hidden="true" />

  return (
    <div className="flex flex-col gap-3">
      {showBorrowerEntity ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground mb-1">Borrowering Entity</span>
          <div className={cn("flex items-center", editingEntity ? "gap-2" : "gap-1")}>
            <div className={cn("flex flex-col gap-1 relative", editingEntity ? "w-72 max-w-[320px]" : "w-auto")}>
              {editingEntity ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="relative w-72 max-w-[320px]">
                      <Input
                        autoFocus
                        value={entityInput}
                        placeholder="Search entities"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v = e.target.value
                          setEntityInput(v)
                          setEntityId(undefined)
                          setShowEntitySuggestions(true)
                        }}
                        onFocus={(e) => {
                          e.stopPropagation()
                          setShowEntitySuggestions(true)
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowEntitySuggestions(false), 120)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            e.stopPropagation()
                            const trimmed = entityInput.trim()
                            persistEntity(entityId ?? null, trimmed || entityName || null)
                            setEntityName(trimmed || entityName || "")
                            setEditingEntity(false)
                            setShowEntitySuggestions(false)
                          } else if (e.key === "Escape") {
                            e.preventDefault()
                            e.stopPropagation()
                            setEntityInput(entityName ?? "")
                            setEditingEntity(false)
                            setShowEntitySuggestions(false)
                          }
                        }}
                      />
                      {showEntitySuggestions && (
                        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                          {entityLoading ? (
                            <div className="px-2 py-1 text-xs text-muted-foreground">Loading…</div>
                          ) : entitySuggestions.length > 0 ? (
                            <ul className="max-h-56 overflow-auto">
                              {entitySuggestions.map((opt) => (
                                <li key={opt.id}>
                                  <button
                                    type="button"
                                    className="w-full cursor-pointer rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEntityInput(opt.name)
                                      setEntityId(opt.id)
                                      setEntityName(opt.name)
                                      persistEntity(opt.id, opt.name)
                                      setShowEntitySuggestions(false)
                                      setEditingEntity(false)
                                    }}
                                  >
                                    {opt.display}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="px-2 py-1 text-xs text-muted-foreground">No results</div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        const trimmed = entityInput.trim()
                        persistEntity(entityId ?? null, trimmed || entityName || null)
                        setEntityName(trimmed || entityName || "")
                        setEditingEntity(false)
                        setShowEntitySuggestions(false)
                      }}
                      aria-label="Save borrowing entity"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEntityInput(entityName ?? "")
                        setEditingEntity(false)
                        setShowEntitySuggestions(false)
                      }}
                      aria-label="Cancel borrowing entity edit"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-base font-semibold text-foreground">{entityName || "—"}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingEntity(true)
                      setEntityInput(entityName ?? "")
                      setShowEntitySuggestions(true)
                    }}
                    className="text-[11px] font-semibold text-destructive cursor-pointer rounded px-1 py-0.5 hover:underline"
                    aria-label="Change borrowing entity"
                  >
                    Change
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 border", entityId ? "border-blue-300 text-blue-700 bg-blue-50" : "border-muted text-muted-foreground")}
              disabled
              aria-label={entityId ? "Linked borrower entity" : "Unlinked borrower entity"}
            >
              {linkedEntityIcon}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {guarantors.length > 0 ? (
          guarantors.map((g, idx) => {
            const key = `${idx}`
            const isEditing = editingGuarantorKey === key
            const currentId = g.id ?? undefined
            const currentName = g.name ?? ""
            const currentEmail = g.email ?? ""
            const isLinked = Boolean(currentId && !(currentId.startsWith("guarantor-") || currentId.startsWith("guarantor-name-")))
            const nameChanged = isEditing ? guarantorInput.trim() !== currentName.trim() : false
            const emailLocked = isLinked && !nameChanged
            const statusKey = `${loanId}:${idx}`
            const status = guarantorEmailStatus[statusKey] ?? "idle"
            return (
              <div
                key={key}
                className={cn("flex flex-col gap-1.5", idx > 0 && "border-t border-border pt-3")}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] font-semibold text-muted-foreground">Guarantor {idx + 1}</span>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-wrap items-start gap-2">
                          <div className="relative">
                            <Input
                              autoFocus
                              className="w-60 max-w-[280px]"
                              value={guarantorInput}
                              placeholder="Search borrowers"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const v = e.target.value
                                setGuarantorInput(v)
                                setShowGuarantorSuggestions(true)
                              }}
                              onFocus={(e) => {
                                e.stopPropagation()
                                setShowGuarantorSuggestions(true)
                              }}
                              onBlur={() => {
                                setTimeout(() => setShowGuarantorSuggestions(false), 120)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  const trimmed = guarantorInput.trim()
                                  setGuarantors((prev) => {
                                    const next = [...prev]
                                    next[idx] = { ...next[idx], name: trimmed || next[idx]?.name, id: next[idx]?.id ?? null }
                                    void persistGuarantors(next)
                                    return next
                                  })
                                  setEditingGuarantorKey(null)
                                  setShowGuarantorSuggestions(false)
                                } else if (e.key === "Escape") {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setGuarantorInput(currentName)
                                  setEditingGuarantorKey(null)
                                  setShowGuarantorSuggestions(false)
                                }
                              }}
                            />
                            {showGuarantorSuggestions && (
                              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
                                {guarantorLoading ? (
                                  <div className="px-2 py-1 text-xs text-muted-foreground">Loading…</div>
                                ) : guarantorSuggestions.length > 0 ? (
                                  <ul className="max-h-56 overflow-auto">
                                    {guarantorSuggestions.map((opt) => (
                                      <li key={opt.id}>
                                        <button
                                          type="button"
                                          className="w-full cursor-pointer rounded-sm px-2 py-1 text-left text-sm hover:bg-muted"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setGuarantors((prev) => {
                                              const next = [...prev]
                                              next[idx] = { id: opt.id, name: opt.name, email: opt.email ?? null }
                                              void persistGuarantors(next)
                                              return next
                                            })
                                            setGuarantorInput(opt.name)
                                            setShowGuarantorSuggestions(false)
                                            setEditingGuarantorKey(null)
                                          }}
                                        >
                                          {opt.display}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="px-2 py-1 text-xs text-muted-foreground">No results</div>
                                )}
                              </div>
                            )}
                          </div>
                          <Input
                            className="w-44"
                            value={guarantorInput === currentName ? currentEmail ?? "" : currentEmail ?? ""}
                            placeholder="Email"
                            disabled={emailLocked}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (emailLocked) return
                              const v = e.target.value
                              setGuarantors((prev) => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], email: v }
                                return next
                              })
                            }}
                            onKeyDown={(e) => {
                              if (emailLocked) return
                              if (e.key === "Enter") {
                                e.preventDefault()
                                e.stopPropagation()
                              setGuarantors((prev) => {
                                const next = [...prev]
                                const trimmedName = guarantorInput.trim() || next[idx]?.name
                                const wasLinked =
                                  next[idx]?.id &&
                                  !(next[idx]?.id?.startsWith("guarantor-") || next[idx]?.id?.startsWith("guarantor-name-"))
                                const nameChangedNow = trimmedName !== (next[idx]?.name ?? "")
                                next[idx] = {
                                  ...next[idx],
                                  id: wasLinked && nameChangedNow ? null : next[idx]?.id ?? null,
                                  name: trimmedName,
                                }
                                void persistGuarantors(next)
                                return next
                              })
                                setEditingGuarantorKey(null)
                                setShowGuarantorSuggestions(false)
                              } else if (e.key === "Escape") {
                                e.preventDefault()
                                e.stopPropagation()
                                setGuarantorInput(currentName)
                                setEditingGuarantorKey(null)
                                setShowGuarantorSuggestions(false)
                              }
                            }}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            setGuarantors((prev) => {
                              const next = [...prev]
                              const trimmedName = guarantorInput.trim() || next[idx]?.name
                              const wasLinked =
                                next[idx]?.id &&
                                !(next[idx]?.id?.startsWith("guarantor-") || next[idx]?.id?.startsWith("guarantor-name-"))
                              const nameChangedNow = trimmedName !== (next[idx]?.name ?? "")
                              next[idx] = {
                                ...next[idx],
                                id: wasLinked && nameChangedNow ? null : next[idx]?.id ?? null,
                                name: trimmedName,
                              }
                              void persistGuarantors(next)
                              return next
                            })
                            setEditingGuarantorKey(null)
                            setShowGuarantorSuggestions(false)
                          }}
                          aria-label="Save guarantor"
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            const isNewEmpty = (!currentId || currentId === null) && !currentName?.trim() && !currentEmail?.trim()
                            if (isNewEmpty) {
                              setGuarantors((prev) => {
                                const next = [...prev]
                                next.splice(idx, 1)
                                return next
                              })
                            } else {
                              setGuarantorInput(currentName)
                            }
                            setEditingGuarantorKey(null)
                            setShowGuarantorSuggestions(false)
                          }}
                          aria-label="Cancel guarantor edit"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col leading-tight">
                          <span className="text-base font-semibold text-foreground">{currentName || "—"}</span>
                          <span className="text-xs text-muted-foreground">{currentEmail || "—"}</span>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingGuarantorKey(key)
                            setGuarantorInput(currentName || "")
                            setShowGuarantorSuggestions(true)
                          }}
                          className="text-[11px] font-semibold text-destructive cursor-pointer rounded px-1 py-0.5 hover:underline"
                          aria-label={`Change guarantor ${idx + 1}`}
                        >
                          Change
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 border",
                          currentId && !(currentId.startsWith("guarantor-") || currentId.startsWith("guarantor-name-"))
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-muted text-muted-foreground"
                        )}
                        disabled
                        aria-label={
                          currentId && !(currentId.startsWith("guarantor-") || currentId.startsWith("guarantor-name-"))
                            ? `Linked guarantor ${idx + 1}`
                            : `Unlinked guarantor ${idx + 1}`
                        }
                      >
                        {currentId && !(currentId.startsWith("guarantor-") || currentId.startsWith("guarantor-name-")) ? (
                          <Link2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Unlink className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </>
                  )}
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 border border-muted text-muted-foreground hover:border-green-400 hover:text-green-600",
                        {
                          "opacity-50 pointer-events-none": !currentEmail,
                        },
                        status === "error" && "animate-[email-shake_0.45s_ease-in-out] motion-reduce:animate-none"
                      )}
                      aria-label={currentEmail ? `Email guarantor ${idx + 1}` : `No email for guarantor ${idx + 1}`}
                      disabled={!currentEmail}
                      onClick={async (e) => {
                        if (!currentEmail) return
                        e.stopPropagation()
                        setGuarantorEmailStatus((prev) => ({ ...prev, [statusKey]: "loading" }))
                        try {
                        const res = await fetch("https://n8n.axora.info/webhook/3075cb28-a5db-499e-b916-95c7ce002dec", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              loanId,
                              guarantorName: currentName,
                              guarantorEmail: currentEmail,
                            }),
                          })
                          const j = await res.json().catch(() => ({} as { sent?: boolean }))
                          const sent = Boolean((j as any)?.sent)
                          setGuarantorEmailStatus((prev) => ({ ...prev, [statusKey]: sent ? "success" : "error" }))
                        } catch {
                          setGuarantorEmailStatus((prev) => ({ ...prev, [statusKey]: "error" }))
                        } finally {
                          setTimeout(() => {
                            setGuarantorEmailStatus((prev) => ({ ...prev, [statusKey]: "idle" }))
                          }, 1600)
                        }
                      }}
                    >
                      {(() => {
                        if (status === "loading") {
                          return (
                            <span className="flex h-4 w-4 items-center justify-center">
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/60 border-t-transparent" />
                            </span>
                          )
                        }
                        if (status === "success") {
                          return <Check className="h-4 w-4 text-green-600 animate-in fade-in zoom-in" aria-hidden="true" />
                        }
                        if (status === "error") {
                          return <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                        }
                        return <Mail className="h-4 w-4" aria-hidden="true" />
                      })()}
                    </Button>
                  )}
                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      {currentEmail && signedEmails.has((currentEmail ?? "").toLowerCase()) ? (
                        <Badge
                          variant="success"
                          className="h-6 text-[11px] font-semibold bg-green-100 text-green-700 border-green-200"
                        >
                          Signed
                        </Badge>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          const email = currentEmail?.toLowerCase() ?? null
                          if (email && signedEmails.has(email)) {
                            setConfirmRemove({ idx, email })
                          } else {
                            removeGuarantor(idx)
                          }
                        }}
                        disabled={totalGuarantors <= 1}
                        aria-label="Remove guarantor"
                      >
                        –
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-sm text-muted-foreground">No guarantors listed.</div>
        )}
        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              addGuarantor()
            }}
            disabled={totalGuarantors >= maxGuarantors}
          >
            Add guarantor
          </Button>
          <span className="text-xs text-muted-foreground">
            {totalGuarantors}/{maxGuarantors}
          </span>
        </div>
      </div>
      <AlertDialog
        open={Boolean(confirmRemove)}
        onOpenChange={(open) => {
          if (!open) setConfirmRemove(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove guarantor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this guarantor? This guarantor already submitted the signed application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmRemove(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmRemove) {
                  removeGuarantor(confirmRemove.idx)
                  setConfirmRemove(null)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
