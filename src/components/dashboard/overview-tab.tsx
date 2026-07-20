"use client"

import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Globe,
  Copy,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  CATEGORY_LABELS,
  SEVERITY_META,
  STATUS_META,
} from "@/lib/constants"
import { timeAgo, formatDate } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#0ea5e9",
  REVIEWING: "#8b5cf6",
  RESOLVED: "#10b981",
}
const CHANNEL_COLORS: Record<string, string> = {
  WEB: "#10b981",
  WHATSAPP: "#22c55e",
}

export function OverviewTab({
  dashboard,
  onTab,
}: {
  dashboard: any
  onTab: (t: any) => void
}) {
  if (!dashboard) return null
  const { kpis, byStatus, bySeverity, byChannel, byCategory, recent, org } = dashboard

  const statusData = byStatus.map((s: any) => ({
    name: STATUS_META[s.status]?.label ?? s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] ?? "#94a3b8",
  }))
  const severityData = bySeverity.map((s: any) => ({
    name: SEVERITY_META[s.severity]?.label ?? s.severity,
    count: s.count,
    fill: SEVERITY_META[s.severity]?.dot.replace("bg-", "").replace("-500", "") === "emerald" ? "#10b981" : SEVERITY_META[s.severity]?.dot.includes("amber") ? "#f59e0b" : SEVERITY_META[s.severity]?.dot.includes("orange") ? "#f97316" : SEVERITY_META[s.severity]?.dot.includes("red") ? "#ef4444" : "#94a3b8",
  }))
  const channelData = byChannel.map((c: any) => ({
    name: c.channel === "WHATSAPP" ? "WhatsApp" : "Web",
    value: c.count,
    color: CHANNEL_COLORS[c.channel] ?? "#94a3b8",
  }))
  const categoryData = byCategory
    .map((c: any) => ({ name: CATEGORY_LABELS[c.category]?.split(" ")[0] ?? c.category, count: c.count }))
    .sort((a: any, b: any) => b.count - a.count)

  const KPI_CARDS = [
    {
      label: "Total cases",
      value: kpis.totalCases,
      icon: Inbox,
      color: "text-sky-600 bg-sky-50 ring-sky-100",
      sub: "all time",
    },
    {
      label: "Open cases",
      value: kpis.openCases,
      icon: Clock,
      color: "text-violet-600 bg-violet-50 ring-violet-100",
      sub: "awaiting action",
    },
    {
      label: "Critical open",
      value: kpis.criticalOpen,
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 ring-rose-100",
      sub: kpis.criticalOpen > 0 ? "needs attention" : "all clear",
      alert: kpis.criticalOpen > 0,
    },
    {
      label: "Resolved (30d)",
      value: kpis.resolved30d,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 ring-emerald-100",
      sub: `avg ${kpis.avgResolutionHours}h to close`,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Compliance overview</h1>
          <p className="text-sm text-zinc-500">{org.name} · {org.industry} · {org.employeeCount} employees</p>
        </div>
        <Button onClick={() => onTab("inbox")} size="sm">
          Open case inbox <ArrowUpRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPI_CARDS.map((k) => (
          <Card key={k.label} className={cn("relative overflow-hidden border-zinc-200", k.alert && "border-rose-200 ring-1 ring-rose-100")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", k.color)}>
                  <k.icon className="h-4 w-4" />
                </div>
                {k.alert && <span className="h-2 w-2 rounded-full bg-rose-500 sw-pulse" />}
              </div>
              <div className="mt-3 text-2xl font-semibold text-zinc-900">{k.value}</div>
              <div className="text-xs font-medium text-zinc-700">{k.label}</div>
              <div className="text-[11px] text-zinc-400">{k.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cases by status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3}>
                    {statusData.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e4e4e7" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-3">
              {statusData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-zinc-600">{d.name}</span>
                  <span className="font-semibold text-zinc-900">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">By severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e4e4e7" }} cursor={{ fill: "#f4f4f5" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Channel split</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={62} paddingAngle={3}>
                    {channelData.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e4e4e7" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-3">
              {channelData.map((d: any) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-zinc-600">{d.name}</span>
                  <span className="font-semibold text-zinc-900">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown + recent */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-zinc-200 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Reports by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryData.map((c: any) => {
                const max = Math.max(...categoryData.map((x: any) => x.count))
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-zinc-700">{c.name}</span>
                      <span className="font-semibold text-zinc-900">{c.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${(c.count / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent cases</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onTab("inbox")}>View all</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.map((c: any) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-2.5 transition-colors hover:bg-zinc-50"
              >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", c.channel === "WHATSAPP" ? "bg-green-50 text-green-600" : "bg-emerald-50 text-emerald-600")}>
                  {c.channel === "WHATSAPP" ? <MessageSquare className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="sw-mono text-xs font-semibold text-zinc-900">{c.caseNumber}</span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", SEVERITY_META[c.severity]?.color)}>
                      {SEVERITY_META[c.severity]?.label}
                    </span>
                  </div>
                  <div className="truncate text-xs text-zinc-500">
                    {c.category && (CATEGORY_LABELS[c.category]?.split(" ")[0])} · {c.department} · {c.accusedName}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium", STATUS_META[c.status]?.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[c.status]?.dot)} />
                    {STATUS_META[c.status]?.label}
                  </span>
                  <span className="text-[10px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                </div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="py-8 text-center text-sm text-zinc-400">No cases yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { tab: "audit", icon: Clock, title: "Verify audit chain", desc: "Prove your trail is tamper-evident" },
          { tab: "duplicates", icon: Copy, title: "Review patterns", desc: "Spot repeated accusations" },
          { tab: "whatsapp", icon: MessageSquare, title: "Test WhatsApp bot", desc: "File a report over chat live" },
        ].map((q) => (
          <button
            key={q.tab}
            onClick={() => onTab(q.tab)}
            className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <q.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-zinc-900">{q.title}</div>
              <div className="text-xs text-zinc-500">{q.desc}</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
          </button>
        ))}
      </div>
    </div>
  )
}
