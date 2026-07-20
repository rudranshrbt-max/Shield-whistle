"use client"

import { useEffect, useState } from "react"
import {
  X,
  ShieldCheck,
  Lock,
  User,
  Building2,
  Calendar,
  MapPin,
  MessageSquare,
  Loader2,
  CheckCircle2,
  GitBranch,
  Send,
  RotateCcw,
  AlertCircle,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { apiFetch, formatDateTime, timeAgo, shortHash } from "@/lib/api-client"
import { CATEGORY_LABELS, SEVERITY_META, STATUS_META, AUDIT_ACTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CaseDetail {
  id: string
  caseNumber: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolution: string | null
  assignee: { id: string; name: string; title: string } | null
  report: {
    reportToken: string
    category: string
    severity: string
    channel: string
    department: string
    accusedName: string
    accusedRole: string
    description: string
    location: string | null
    incidentDate: string | null
    submittedAt: string
    anonymous: boolean
    consentFollowup: boolean
    contact: string | null
  }
  messages: { id: string; authorRole: string; content: string; createdAt: string }[]
}

interface CaseAudit {
  entries: {
    id: string
    action: string
    actorType: string
    actorEmail: string | null
    payload: string
    timestamp: string
    hash: string
    prevHash: string
  }[]
}

export function CaseDetailSheet({
  caseId,
  orgSlug,
  open,
  onOpenChange,
  onMutated,
}: {
  caseId: string | null
  orgSlug: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onMutated: () => void
}) {
  const [detail, setDetail] = useState<CaseDetail | null>(null)
  const [audit, setAudit] = useState<CaseAudit | null>(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [resolution, setResolution] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async (id: string) => {
    setLoading(true)
    try {
      const [d, a] = await Promise.all([
        apiFetch<CaseDetail>(`/api/cases/${id}`, { orgSlug }),
        apiFetch<CaseAudit>(`/api/audit?caseId=${id}&limit=50`, { orgSlug }),
      ])
      setDetail(d)
      setAudit(a)
      setResolution(d.resolution ?? "")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (caseId && open) {
      setDetail(null)
      setAudit(null)
      load(caseId)
    }
  }, [caseId, open])

  const updateStatus = async (status: string) => {
    if (!detail) return
    setSaving(true)
    try {
      const body: any = { status }
      if (status === "RESOLVED" && resolution) body.resolution = resolution
      await apiFetch(`/api/cases/${detail.id}`, { orgSlug, method: "PATCH", body: JSON.stringify(body) })
      toast.success(`Status → ${STATUS_META[status].label}`)
      await load(detail.id)
      onMutated()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const updatePriority = async (priority: string) => {
    if (!detail) return
    setSaving(true)
    try {
      await apiFetch(`/api/cases/${detail.id}`, { orgSlug, method: "PATCH", body: JSON.stringify({ priority }) })
      toast.success(`Priority → ${priority}`)
      await load(detail.id)
      onMutated()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const addNote = async () => {
    if (!detail || !note.trim()) return
    setSaving(true)
    try {
      await apiFetch(`/api/cases/${detail.id}/messages`, {
        orgSlug,
        method: "POST",
        body: JSON.stringify({ content: note }),
      })
      setNote("")
      toast.success("Note added (encrypted)")
      await load(detail.id)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sw-scroll w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {detail && (
              <>
                <span className="sw-mono">{detail.caseNumber}</span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", STATUS_META[detail.status].color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_META[detail.status].dot)} />
                  {STATUS_META[detail.status].label}
                </span>
              </>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">Case detail</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-5 px-4 pb-10">
            {/* Workflow actions */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status workflow</div>
                <span className="text-[11px] text-zinc-400">Updated {timeAgo(detail.updatedAt)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {["SUBMITTED", "REVIEWING", "RESOLVED"].map((s) => {
                  const active = detail.status === s
                  const next =
                    (detail.status === "SUBMITTED" && s === "REVIEWING") ||
                    (detail.status === "REVIEWING" && s === "RESOLVED") ||
                    (detail.status === "RESOLVED" && s === "REVIEWING")
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      disabled={saving || active}
                      onClick={() => updateStatus(s)}
                      className={cn(active && "bg-emerald-600 hover:bg-emerald-700")}
                    >
                      {active && <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      {s === "RESOLVED" && next ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : null}
                      {STATUS_META[s].label}
                    </Button>
                  )
                })}
              </div>
              {detail.status === "REVIEWING" && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-medium text-zinc-600">Resolution summary (required to resolve)</label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Document the findings and remediation for the audit trail…"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Priority + assignee */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-200 p-3">
                <div className="text-xs text-zinc-500">Priority</div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                    <button
                      key={p}
                      onClick={() => updatePriority(p)}
                      disabled={saving}
                      className={cn(
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all",
                        detail.priority === p
                          ? cn(SEVERITY_META[p].color, "ring-1 ring-current")
                          : "border-zinc-200 text-zinc-500 hover:border-zinc-300",
                      )}
                    >
                      {SEVERITY_META[p].label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 p-3">
                <div className="text-xs text-zinc-500">Assigned to</div>
                <div className="mt-1.5 flex items-center gap-2">
                  {detail.assignee ? (
                    <>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                        {detail.assignee.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-900">{detail.assignee.name}</div>
                        <div className="text-[11px] text-zinc-500">{detail.assignee.title}</div>
                      </div>
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                      <User className="h-4 w-4" /> Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Report content (decrypted) */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-zinc-900">Decrypted report content</h3>
                <Badge variant="outline" className="ml-auto border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                  decrypted for your eyes
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: MessageSquare, label: "Category", value: CATEGORY_LABELS[detail.report.category] },
                  {
                    icon: AlertCircle,
                    label: "Severity",
                    value: SEVERITY_META[detail.report.severity]?.label,
                    dot: SEVERITY_META[detail.report.severity]?.dot,
                  },
                  { icon: Building2, label: "Department", value: detail.report.department },
                  { icon: User, label: "Accused", value: `${detail.report.accusedName} · ${detail.report.accusedRole}` },
                  { icon: Calendar, label: "Incident", value: detail.report.incidentDate ? formatDateTime(detail.report.incidentDate) : "—" },
                  { icon: MapPin, label: "Location", value: detail.report.location || "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-zinc-100 bg-white p-3">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <m.icon className="h-3.5 w-3.5" /> {m.label}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                      {m.dot && <span className={cn("h-2 w-2 rounded-full", m.dot)} />}
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zinc-500">Narrative</div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-800">{detail.report.description}</p>
              </div>

              {detail.report.consentFollowup && detail.report.contact && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Whistleblower consented to follow-up
                  </div>
                  <div className="mt-1 sw-mono text-sm text-emerald-900">{detail.report.contact}</div>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Channel: {detail.report.channel === "WHATSAPP" ? "WhatsApp" : "Web"}</span>
                <span>Token: <span className="sw-mono">{detail.report.reportToken}</span></span>
              </div>
            </div>

            <Separator />

            {/* Internal notes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">Internal notes (encrypted)</h3>
              <div className="space-y-2">
                {detail.messages.length === 0 && (
                  <p className="text-xs text-zinc-400">No notes yet. Add context for fellow officers — these are encrypted and audit-logged.</p>
                )}
                {detail.messages.map((m) => (
                  <div key={m.id} className="rounded-lg border border-zinc-100 bg-white p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-700">{m.authorRole === "OFFICER" ? "Officer" : m.authorRole}</span>
                      <span className="text-zinc-400">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-800">{m.content}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add an internal note…"
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={addNote} disabled={saving || !note.trim()} size="icon" className="self-end bg-emerald-600 hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Case audit trail */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-zinc-900">Case audit trail</h3>
                <Badge variant="outline" className="ml-auto text-[10px]">{audit?.entries.length ?? 0} events</Badge>
              </div>
              <div className="relative space-y-3 pl-5">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-zinc-200" />
                {audit?.entries.map((e, i) => (
                  <div key={e.id} className="relative">
                    <div className={cn("absolute -left-[14px] top-1 h-3 w-3 rounded-full border-2 border-white", i === 0 ? "bg-emerald-500" : "bg-zinc-300")} />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-zinc-700">{AUDIT_ACTIONS[e.action] ?? e.action}</span>
                      <span className="text-[10px] text-zinc-400">{timeAgo(e.timestamp)}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-500">
                      by {e.actorEmail ?? e.actorType.toLowerCase()}
                    </div>
                    <div className="sw-mono mt-1 text-[10px] text-zinc-400">hash: {shortHash(e.hash, 16)}</div>
                  </div>
                ))}
              </div>
            </div>

            {detail.status === "RESOLVED" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" /> Resolution
                </div>
                <p className="mt-1.5 text-sm text-emerald-900">{detail.resolution}</p>
                <Button variant="outline" size="sm" className="mt-3 border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100" onClick={() => updateStatus("REVIEWING")}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen case
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
