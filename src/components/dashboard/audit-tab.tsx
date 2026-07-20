"use client"

import { useEffect, useState, useCallback } from "react"
import {
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Fingerprint,
  Download,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiFetch, formatDateTime, shortHash } from "@/lib/api-client"
import { AUDIT_ACTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AuditEntry {
  id: string
  caseId: string | null
  reportId: string | null
  actorType: string
  actorEmail: string | null
  action: string
  payload: string
  prevHash: string
  hash: string
  timestamp: string
}

export function AuditTab({ orgSlug }: { orgSlug: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [verification, setVerification] = useState<{ ok: boolean; detail: string } | null>(null)
  const [headHash, setHeadHash] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState("all")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await apiFetch<{
        entries: AuditEntry[]
        verification: { ok: boolean; detail: string }
        headHash: string
      }>(`/api/audit?action=${action}&limit=200`, { orgSlug })
      setEntries(d.entries)
      setVerification(d.verification)
      setHeadHash(d.headHash)
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [orgSlug, action])

  useEffect(() => {
    const t = setTimeout(load, 150)
    return () => clearTimeout(t)
  }, [load])

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) {
        n.delete(id)
      } else {
        n.add(id)
      }
      return n
    })

  const exportLog = () => {
    const blob = new Blob(
      [JSON.stringify({ verification, headHash, entries }, null, 2)],
      { type: "application/json" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `shieldwhistle-audit-${orgSlug}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Audit log exported")
  }

  const actorColor: Record<string, string> = {
    SYSTEM: "bg-zinc-100 text-zinc-600",
    OFFICER: "bg-violet-100 text-violet-700",
    WHISTLEBLOWER: "bg-emerald-100 text-emerald-700",
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Tamper-proof audit trail</h1>
          <p className="text-sm text-zinc-500">
            Every action is hash-chained. Re-compute the chain live to prove integrity to a regulator.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportLog}>
          <Download className="mr-1.5 h-4 w-4" /> Export for auditor
        </Button>
      </div>

      {/* Verification banner */}
      <Card className={cn("border", verification?.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", verification?.ok ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
            {verification?.ok ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={cn("text-sm font-semibold", verification?.ok ? "text-emerald-800" : "text-rose-800")}>
              {verification?.ok ? "Chain integrity verified ✓" : "Chain integrity BROKEN"}
            </div>
            <div className={cn("text-xs", verification?.ok ? "text-emerald-700" : "text-rose-700")}>
              {verification?.detail}
            </div>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="text-[10px] uppercase tracking-wide text-zinc-500">Head hash</div>
            <div className="sw-mono text-xs font-semibold text-zinc-700">{shortHash(headHash, 20)}</div>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Re-verify"}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-zinc-400" />
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {Object.entries(AUDIT_ACTIONS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto border-zinc-200 bg-white">
          <GitBranch className="mr-1 h-3 w-3" /> {entries.length} entries
        </Badge>
      </div>

      {/* Timeline */}
      <Card className="border-zinc-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="sw-scroll max-h-[640px] divide-y divide-zinc-100 overflow-y-auto">
              {entries.map((e, i) => {
                const isOpen = expanded.has(e.id)
                const isGenesis = e.prevHash === "GENESIS"
                let payload: any = {}
                try {
                  payload = JSON.parse(e.payload)
                } catch {
                  /* noop */
                }
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className="block w-full px-4 py-3 text-left transition-colors hover:bg-zinc-50"
                  >
                    <div className="flex items-start gap-3">
                      {/* hash chain dot */}
                      <div className="mt-0.5 flex flex-col items-center">
                        <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold", isGenesis ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500")}>
                          {isGenesis ? <Fingerprint className="h-3.5 w-3.5" /> : i + 1}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">{AUDIT_ACTIONS[e.action] ?? e.action}</span>
                          <span className={cn("rounded px-1.5 py-0 text-[10px] font-medium", actorColor[e.actorType] ?? "bg-zinc-100 text-zinc-600")}>
                            {e.actorEmail ?? e.actorType.toLowerCase()}
                          </span>
                          <span className="text-[11px] text-zinc-400">{formatDateTime(e.timestamp)}</span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                          <span className="sw-mono">prev: {shortHash(e.prevHash, 14)}</span>
                          <span>→</span>
                          <span className="sw-mono">hash: {shortHash(e.hash, 14)}</span>
                        </div>

                        {isOpen && (
                          <div className="mt-2 rounded-lg border border-zinc-100 bg-zinc-50 p-2.5 text-xs">
                            <pre className="sw-mono whitespace-pre-wrap break-all text-zinc-600">
                              {JSON.stringify(payload, null, 2)}
                            </pre>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-zinc-400">
                              <Fingerprint className="h-3 w-3" /> full hash: <span className="sw-mono">{e.hash}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </button>
                )
              })}
              {entries.length === 0 && (
                <div className="py-12 text-center text-sm text-zinc-400">No audit entries.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
