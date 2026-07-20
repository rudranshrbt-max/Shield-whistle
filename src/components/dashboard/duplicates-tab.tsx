"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  AlertTriangle,
  TrendingUp,
  Users,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiFetch, formatDate, timeAgo } from "@/lib/api-client"
import { CATEGORY_LABELS, SEVERITY_META, STATUS_META } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface DupReport {
  id: string
  caseNumber: string | null
  status: string
  severity: string
  channel: string
  submittedAt: string
}
interface DupGroup {
  signature: string
  department: string
  accusedName: string
  accusedRole: string
  category: string
  count: number
  openCount: number
  topSeverity: string
  firstReportedAt: string
  lastReportedAt: string
  reports: DupReport[]
}

export function DuplicatesTab({ orgSlug }: { orgSlug: string }) {
  const [groups, setGroups] = useState<DupGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [totalFlagged, setTotalFlagged] = useState(0)

  useEffect(() => {
    apiFetch<{ duplicates: DupGroup[]; totalFlaggedReports: number }>("/api/duplicates", { orgSlug })
      .then((d) => {
        setGroups(d.duplicates)
        setTotalFlagged(d.totalFlaggedReports)
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [orgSlug])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Duplicate pattern detection</h1>
        <p className="text-sm text-zinc-500">
          When the same person in the same department is reported again, we surface the pattern — the single most valuable signal for an officer.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600 ring-1 ring-amber-100">
              <Copy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-zinc-900">{groups.length}</div>
              <div className="text-xs text-zinc-600">repeated-accusation patterns</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600 ring-1 ring-rose-100">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-zinc-900">{totalFlagged}</div>
              <div className="text-xs text-zinc-600">reports involved</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 ring-1 ring-emerald-100">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-zinc-900">
                {groups.filter((g) => g.openCount > 0).length}
              </div>
              <div className="text-xs text-zinc-600">patterns with open cases</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-dashed border-zinc-300">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Copy className="h-8 w-8 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-500">No repeated-accusation patterns detected.</p>
            <p className="text-xs text-zinc-400">Each accused person has been reported exactly once.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const sev = SEVERITY_META[g.topSeverity]
            const escalating = g.reports.length >= 3
            return (
              <Card key={g.signature} className={cn("overflow-hidden border-zinc-200", escalating && "border-rose-200 ring-1 ring-rose-100")}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1", escalating ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-amber-50 text-amber-600 ring-amber-100")}>
                        {escalating ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {g.accusedName}{" "}
                          <span className="text-sm font-normal text-zinc-500">· {g.accusedRole}</span>
                        </CardTitle>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                          <span className="font-medium text-zinc-700">{g.department}</span>
                          <span>·</span>
                          <span>{CATEGORY_LABELS[g.category]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border", sev?.color)}>
                        <span className={cn("mr-1 h-1.5 w-1.5 rounded-full", sev?.dot)} />
                        {sev?.label} severity
                      </Badge>
                      <Badge variant="outline" className="border-zinc-200 bg-white">
                        <Copy className="mr-1 h-3 w-3" /> {g.count}× reported
                      </Badge>
                      {g.openCount > 0 && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                          {g.openCount} open
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {escalating && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span><strong>Escalation risk:</strong> {g.count} reports against the same person. Consider consolidating into a single investigation and notifying the audit committee.</span>
                    </div>
                  )}
                  <div className="mb-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>First reported {formatDate(g.firstReportedAt)}</span>
                    <span>Most recent {timeAgo(g.lastReportedAt)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {g.reports.map((r, i) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">{i + 1}</span>
                        <span className="sw-mono font-medium text-zinc-700">{r.caseNumber ?? "—"}</span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", SEVERITY_META[r.severity]?.color)}>
                          {SEVERITY_META[r.severity]?.label}
                        </span>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", STATUS_META[r.status]?.color)}>
                          {STATUS_META[r.status]?.label}
                        </span>
                        <span className="ml-auto text-[10px] text-zinc-400">{r.channel === "WHATSAPP" ? "WhatsApp" : "Web"}</span>
                        <span className="text-[10px] text-zinc-400">{timeAgo(r.submittedAt)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm">
                      Consolidate investigation <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="border-zinc-200 bg-zinc-50">
        <CardContent className="flex items-start gap-3 p-4 text-xs text-zinc-600">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Patterns are grouped by <strong>department + accused + category</strong>. The signature is hashed so officers see the pattern without exposing report content. This is V1 detection — severity-weighted clustering ships after the first 10 paying clients.
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
