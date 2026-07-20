"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Search,
  Filter,
  Inbox as InboxIcon,
  MessageSquare,
  Globe,
  ArrowUpDown,
  Loader2,
  Copy,
  Users,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch, timeAgo } from "@/lib/api-client"
import {
  CATEGORY_LABELS,
  SEVERITY_META,
  STATUS_META,
  REPORT_CATEGORIES,
  REPORT_SEVERITIES,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { CaseDetailSheet } from "./case-detail-sheet"

interface CaseRow {
  id: string
  caseNumber: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  assignee: string | null
  report: {
    category: string
    severity: string
    channel: string
    department: string
    accusedName: string
    accusedRole: string
    incidentDate: string | null
    submittedAt: string
  }
}

export function InboxTab({ orgSlug }: { orgSlug: string }) {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: "all",
    severity: "all",
    category: "all",
    channel: "all",
    q: "",
    sort: "newest",
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => v && v !== "all" && params.set(k, v))
      const d = await apiFetch<{ cases: CaseRow[] }>(`/api/cases?${params}`, { orgSlug })
      setCases(d.cases)
    } catch {
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug, filters])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const openCase = (id: string) => {
    setSelected(id)
    setSheetOpen(true)
  }

  const counts = {
    all: cases.length,
    SUBMITTED: cases.filter((c) => c.status === "SUBMITTED").length,
    REVIEWING: cases.filter((c) => c.status === "REVIEWING").length,
    RESOLVED: cases.filter((c) => c.status === "RESOLVED").length,
  }

  const statusTabs: { id: string; label: string }[] = [
    { id: "all", label: "All" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "REVIEWING", label: "Reviewing" },
    { id: "RESOLVED", label: "Resolved" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Case inbox</h1>
          <p className="text-sm text-zinc-500">Triage, assign, and move cases through the status workflow.</p>
        </div>
        <Badge variant="outline" className="border-zinc-200 bg-white">
          <InboxIcon className="mr-1 h-3 w-3" /> {counts.all} cases
        </Badge>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
        {statusTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilters((f) => ({ ...f, status: t.id }))}
            className={cn(
              "relative shrink-0 px-3 py-2 text-sm font-medium transition-colors",
              filters.status === t.id ? "text-emerald-700" : "text-zinc-500 hover:text-zinc-900",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-zinc-400">{counts[t.id as keyof typeof counts] ?? 0}</span>
            {filters.status === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-emerald-600" />}
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-zinc-200">
        <CardContent className="flex flex-wrap items-center gap-2 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search department, accused, case #…"
              className="pl-9"
            />
          </div>
          <Select value={filters.severity} onValueChange={(v) => setFilters((f) => ({ ...f, severity: v }))}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              {REPORT_SEVERITIES.map((s) => <SelectItem key={s} value={s}>{SEVERITY_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {REPORT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c].split(" ")[0]}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.channel} onValueChange={(v) => setFilters((f) => ({ ...f, channel: v }))}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Channel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="WEB">Web</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}>
            <SelectTrigger className="w-[130px]"><ArrowUpDown className="mr-1.5 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Case list */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </div>
      ) : cases.length === 0 ? (
        <Card className="border-dashed border-zinc-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Filter className="h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">No cases match these filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => openCase(c.id)}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-left transition-all hover:-translate-y-px hover:border-emerald-300 hover:shadow-md"
            >
              {/* Channel icon */}
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.report.channel === "WHATSAPP" ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-600")}>
                {c.report.channel === "WHATSAPP" ? <MessageSquare className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              </div>

              {/* Main */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="sw-mono text-sm font-semibold text-zinc-900">{c.caseNumber}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", SEVERITY_META[c.report.severity]?.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_META[c.report.severity]?.dot)} />
                    {SEVERITY_META[c.report.severity]?.label}
                  </span>
                  <span className="text-[11px] text-zinc-400">·</span>
                  <span className="text-[11px] text-zinc-500">{CATEGORY_LABELS[c.report.category]}</span>
                </div>
                <div className="mt-0.5 truncate text-sm text-zinc-700">
                  <span className="font-medium">{c.report.department}</span> · {c.report.accusedName} <span className="text-zinc-400">({c.report.accusedRole})</span>
                </div>
              </div>

              {/* Meta */}
              <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", STATUS_META[c.status]?.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[c.status]?.dot)} />
                  {STATUS_META[c.status]?.label}
                </span>
                {c.assignee ? (
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500"><Users className="h-3 w-3" /> {c.assignee.split(" ")[0]}</span>
                ) : (
                  <span className="text-[10px] text-amber-600">unassigned</span>
                )}
                <span className="text-[10px] text-zinc-400">{timeAgo(c.createdAt)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CaseDetailSheet
        caseId={selected}
        orgSlug={orgSlug}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onMutated={load}
      />
    </div>
  )
}
