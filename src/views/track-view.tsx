"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/store"
import { apiFetch, formatDateTime, timeAgo } from "@/lib/api-client"
import { CATEGORY_LABELS, SEVERITY_META, STATUS_META } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface TrackResult {
  reportToken: string
  status: string
  category: string
  severity: string
  channel: string
  submittedAt: string
  caseNumber: string | null
  resolution: string | null
  updatedAt: string
}

export function TrackView() {
  const { setView } = useApp()
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const track = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await apiFetch<TrackResult>(`/api/track?token=${encodeURIComponent(token.trim())}`)
      setResult(r)
    } catch (e: any) {
      setError(e.message || "No report found")
    } finally {
      setLoading(false)
    }
  }

  const stages = ["SUBMITTED", "REVIEWING", "RESOLVED"]
  const currentIdx = result ? stages.indexOf(result.status) : -1

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => setView("landing")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700">
          <Eye className="mr-1 h-3 w-3" /> Anonymous tracking
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Track your report</h1>
        <p className="mt-2 text-zinc-600">
          Enter the token you received when you submitted. No login, no name — just the token.
        </p>
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && track()}
                placeholder="SW-XXXX-XXXX-XXXX"
                className="sw-mono pl-9"
              />
            </div>
            <Button onClick={track} disabled={loading || !token.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Checking…" : "Check status"}
            </Button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
            <Lock className="h-3 w-3" /> This lookup is anonymous. We only return status, never content.
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="mt-4 border-rose-200 bg-rose-50">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-rose-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">!</span>
            {error}. Double-check your token — it's case-sensitive.
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mt-4 border-zinc-200 shadow-sm sw-fade-up">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_META[result.status].dot)} />
                  <span className="text-lg font-semibold text-zinc-900">{STATUS_META[result.status].label}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Case</div>
                <div className="sw-mono text-sm font-semibold text-zinc-900">{result.caseNumber ?? "—"}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {stages.map((s, i) => {
                  const reached = i <= currentIdx
                  const isCurrent = i === currentIdx
                  return (
                    <div key={s} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-center">
                        {i > 0 && (
                          <div className={cn("h-0.5 flex-1", i <= currentIdx ? "bg-emerald-500" : "bg-zinc-200")} />
                        )}
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all",
                            reached
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-zinc-200 bg-white text-zinc-400",
                            isCurrent && "ring-4 ring-emerald-100 sw-pulse",
                          )}
                        >
                          {reached ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>
                        {i < stages.length - 1 && (
                          <div className={cn("h-0.5 flex-1", i < currentIdx ? "bg-emerald-500" : "bg-zinc-200")} />
                        )}
                      </div>
                      <div className={cn("mt-2 text-xs font-medium", reached ? "text-zinc-900" : "text-zinc-400")}>
                        {STATUS_META[s].label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Meta grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Category", value: CATEGORY_LABELS[result.category] ?? result.category },
                { label: "Severity", value: SEVERITY_META[result.severity]?.label ?? result.severity, dot: SEVERITY_META[result.severity]?.dot },
                { label: "Channel", value: result.channel === "WHATSAPP" ? "WhatsApp" : "Web" },
                { label: "Submitted", value: timeAgo(result.submittedAt) },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-500">{m.label}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                    {m.dot && <span className={cn("h-2 w-2 rounded-full", m.dot)} />}
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {result.resolution && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <ShieldCheck className="h-4 w-4" /> Resolution
                </div>
                <p className="mt-1.5 text-sm text-emerald-900">{result.resolution}</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <span>Last updated {formatDateTime(result.updatedAt)}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.reportToken)
                  toast.success("Token copied")
                }}
                className="inline-flex items-center gap-1 hover:text-zinc-900"
              >
                <Copy className="h-3 w-3" /> Copy token
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {!result && !error && (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-400" />
          <p className="mt-3 text-sm text-zinc-500">
            Don't have a token yet?{" "}
            <button onClick={() => setView("report")} className="font-medium text-emerald-600 hover:underline">
              Submit a report
            </button>{" "}
            to get one.
          </p>
        </div>
      )}
    </div>
  )
}
