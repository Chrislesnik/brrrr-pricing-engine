"use client"

import { useOrganization, useUser } from "@clerk/nextjs"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  ChevronLeft,
  ChevronRight,
  Database,
  ExternalLink,
  HardDrive,
  KeyRound,
  Lightbulb,
  ScrollText,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"
import { ReactNode, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { LogoSupabase } from "@/components/logo-supabase"
import { DatabaseManager } from "@/components/supabase-manager/database"
import { LogsManager } from "@/components/supabase-manager/logs"
import { SecretsManager } from "@/components/supabase-manager/secrets"
import { StorageManager } from "@/components/supabase-manager/storage"
import { SuggestionsManager } from "@/components/supabase-manager/suggestions"
import {
  SheetNavigationProvider,
  useSheetNavigation,
} from "@/contexts/SheetNavigationContext"

const PROJECT_REF =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ""

const queryClient = new QueryClient()

// ─── Nav items (Auth/Users excluded — managed by Clerk) ──────────────────────
function useNavItems(projectRef: string) {
  return useMemo(
    () => [
      { title: "Database", icon: Database, component: <DatabaseManager projectRef={projectRef} /> },
      { title: "Storage",  icon: HardDrive, component: <StorageManager projectRef={projectRef} /> },
      { title: "Secrets",  icon: KeyRound,  component: <SecretsManager projectRef={projectRef} /> },
      { title: "Logs",     icon: ScrollText, component: <LogsManager projectRef={projectRef} /> },
      { title: "Suggestions", icon: Lightbulb, component: <SuggestionsManager projectRef={projectRef} /> },
    ],
    [projectRef]
  )
}

// ─── Inner view (sidebar + content) ──────────────────────────────────────────
function ManagerView({ projectRef }: { projectRef: string }) {
  const { stack, push, popTo, reset } = useSheetNavigation()
  const navItems = useNavItems(projectRef)

  const currentView = stack[stack.length - 1]
  const activeTitle = stack.length > 0 ? stack[0].title : null

  function navigate(title: string, component: ReactNode) {
    if (stack.length === 1 && stack[0].title === title) return
    reset()
    push({ title, component })
  }

  return (
    <div className="grid grid-cols-[220px_1fr] h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex flex-col border-r px-3 py-6 pb-0">
        <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Platform Manager
        </p>
        <nav className="grow space-y-0.5">
          {navItems.map(({ title, icon: Icon, component }) => (
            <Button
              key={title}
              variant={activeTitle === title ? "secondary" : "ghost"}
              className="w-full justify-start text-sm"
              onClick={() => navigate(title, component)}
            >
              <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {title}
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t -mx-3">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Link
                href={`https://supabase.com/dashboard/project/${projectRef}`}
                target="_blank"
                className="flex items-center px-4 w-full text-sm py-4 h-auto justify-start gap-3 text-left hover:bg-accent"
              >
                <LogoSupabase size={16} />
                <span className="flex-1 text-muted-foreground">Open in Supabase</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50" />
              </Link>
            </HoverCardTrigger>
            <HoverCardContent sideOffset={8} align="start" side="top" className="text-sm w-[200px]">
              <h4 className="font-semibold mb-1">Supabase Dashboard</h4>
              <p className="text-muted-foreground text-xs">
                Opens the full Supabase dashboard for project <code className="font-mono">{projectRef}</code>.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col overflow-hidden h-full">
        {/* Breadcrumb bar */}
        <div className="flex items-center h-11 shrink-0 px-4 border-b gap-2">
          {stack.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => popTo(stack.length - 2)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {stack.map((item: { title: string }, i: number) => (
              <div key={`${item.title}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {i === stack.length - 1 ? (
                  <span className="font-semibold text-foreground">{item.title}</span>
                ) : (
                  <button onClick={() => popTo(i)} className="hover:underline">
                    {item.title}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grow overflow-y-auto">
          {currentView ? (
            currentView.component
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a section from the sidebar to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Access guard ─────────────────────────────────────────────────────────────
function AccessGuard({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { organization, membership, isLoaded: orgLoaded } = useOrganization()

  if (!userLoaded || !orgLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  const orgMeta = organization?.publicMetadata as { is_internal_yn?: boolean } | undefined
  const isInternal = orgMeta?.is_internal_yn === true
  const role = membership?.role
  const isAdminOrOwner = role === "org:admin" || role === "org:owner"

  if (!user || !isInternal || !isAdminOrOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <ShieldAlert className="h-10 w-10 text-destructive/60" />
        <div>
          <p className="font-semibold text-foreground">Access restricted</p>
          <p className="text-sm text-muted-foreground mt-1">
            The Platform Manager is only available to Admin and Owner members of an internal
            organization.
          </p>
        </div>
      </div>
    )
  }

  if (!PROJECT_REF) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
        <Shield className="h-8 w-8 text-warning/60" />
        <p className="text-sm text-muted-foreground">
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> is not configured.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DatabaseManagerPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background border rounded-xl overflow-hidden shadow-sm">
      <QueryClientProvider client={queryClient}>
        <AccessGuard>
          <SheetNavigationProvider
            onStackEmpty={() => {}}
            initialStack={[
              {
                title: "Database",
                component: <DatabaseManager projectRef={PROJECT_REF} />,
              },
            ]}
          >
            <ManagerView projectRef={PROJECT_REF} />
          </SheetNavigationProvider>
        </AccessGuard>
      </QueryClientProvider>
    </div>
  )
}
