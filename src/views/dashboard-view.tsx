"use client"

import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Inbox,
  GitBranch,
  Copy,
  MessageSquare,
  Settings,
  ChevronDown,
  ShieldCheck,
  Lock,
  Building2,
  AlertTriangle,
  Search,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApp, type DashboardTab } from "@/lib/store"
import { apiFetch, formatINR } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { OverviewTab } from "@/components/dashboard/overview-tab"
import { InboxTab } from "@/components/dashboard/inbox-tab"
import { AuditTab } from "@/components/dashboard/audit-tab"
import { DuplicatesTab } from "@/components/dashboard/duplicates-tab"
import { WhatsappTab } from "@/components/dashboard/whatsapp-tab"
import { SettingsTab } from "@/components/dashboard/settings-tab"

const TABS: { id: DashboardTab; label: string; icon: any; desc: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, desc: "KPIs & trends" },
  { id: "inbox", label: "Case Inbox", icon: Inbox, desc: "Triage & workflow" },
  { id: "audit", label: "Audit Trail", icon: GitBranch, desc: "Tamper-proof log" },
  { id: "duplicates", label: "Duplicate Patterns", icon: Copy, desc: "Repeated accusations" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, desc: "Bot & integration" },
  { id: "settings", label: "Settings", icon: Settings, desc: "Org & encryption" },
]

interface OrgSummary {
  id: string
  name: string
  slug: string
  industry: string
  employeeCount: number
  plan: string
  monthlyFee: number
}

export function DashboardView() {
  const { activeOrgSlug, setActiveOrgSlug, setView, dashboardTab, setDashboardTab, orgs, setOrgs, orgsLoaded } = useApp()
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!orgsLoaded) {
      apiFetch<{ orgs: OrgSummary[] }>("/api/orgs").then((d) => setOrgs(d.orgs)).catch(() => {})
    }
  }, [orgsLoaded, setOrgs])

  useEffect(() => {
    if (!activeOrgSlug) return
    setLoading(true)
    apiFetch("/api/dashboard", { orgSlug: activeOrgSlug })
      .then((d) => setDashboard(d))
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false))
  }, [activeOrgSlug])

  // Org gate
  if (!activeOrgSlug) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
            <Building2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Officer dashboard</h1>
          <p className="mt-2 text-zinc-600">
            Select an organization to continue. In production this is gated by SSO — here you can preview any demo org.
          </p>
        </div>

        {!orgsLoaded ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {orgs.map((o) => (
              <button
                key={o.id}
                onClick={() => useApp.getState().gotoDashboard(o.slug)}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{o.plan}</Badge>
                </div>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">{o.name}</h3>
                <p className="text-xs text-zinc-500">{o.industry} · {o.employeeCount} employees</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Open dashboard →
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center">
          <p className="text-sm text-zinc-500">
            Want to provision a new org?{" "}
            <button onClick={() => setView("landing")} className="font-medium text-emerald-600 hover:underline">
              Go to onboarding
            </button>
          </p>
        </div>
      </div>
    )
  }

  const org = dashboard?.org
  const pilotDaysLeft = org?.pilotEndsAt
    ? Math.max(0, Math.ceil((new Date(org.pilotEndsAt).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-0 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
      {/* Sidebar */}
      <aside className="mb-4 lg:mb-0 lg:mr-6 lg:w-64 lg:shrink-0">
        <div className="lg:sticky lg:top-20">
          {/* Org switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{org?.name ?? "Loading…"}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orgs.map((o) => (
                <DropdownMenuItem
                  key={o.id}
                  onClick={() => setActiveOrgSlug(o.slug)}
                  className={cn(o.slug === activeOrgSlug && "bg-emerald-50")}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="truncate">{o.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView("landing")}>
                <LogOut className="mr-2 h-4 w-4" /> Exit dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plan + pilot */}
          {org && (
            <div className="mt-3 rounded-xl border border-zinc-200 bg-gradient-to-br from-emerald-50 to-white p-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{org.plan}</Badge>
                <span className="text-xs text-zinc-500">{formatINR(org.monthlyFee)}/mo</span>
              </div>
              {pilotDaysLeft !== null && pilotDaysLeft > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" /> {pilotDaysLeft} pilot days left
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setDashboardTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full",
                  dashboardTab === t.id
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{t.label}</span>
                <span className="lg:hidden">{t.label.split(" ")[0]}</span>
              </button>
            ))}
          </nav>

          {/* Officer card */}
          <div className="mt-4 hidden rounded-xl border border-zinc-200 bg-white p-3 lg:block">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">PN</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-900">Priya Nair</div>
                <div className="truncate text-xs text-zinc-500">Chief Compliance Officer</div>
              </div>
            </div>
          </div>

          <div className="mt-4 hidden items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-[11px] text-zinc-300 lg:flex">
            <Lock className="h-3 w-3 text-emerald-400" />
            Viewing decrypted data · all access audit-logged
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        {loading && !dashboard ? (
          <div className="flex h-64 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          </div>
        ) : (
          <>
            {dashboardTab === "overview" && <OverviewTab dashboard={dashboard} onTab={setDashboardTab} />}
            {dashboardTab === "inbox" && <InboxTab orgSlug={activeOrgSlug} />}
            {dashboardTab === "audit" && <AuditTab orgSlug={activeOrgSlug} />}
            {dashboardTab === "duplicates" && <DuplicatesTab orgSlug={activeOrgSlug} />}
            {dashboardTab === "whatsapp" && <WhatsappTab orgSlug={activeOrgSlug} />}
            {dashboardTab === "settings" && <SettingsTab org={org} />}
          </>
        )}
      </main>
    </div>
  )
}
