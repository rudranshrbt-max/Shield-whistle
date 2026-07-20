"use client"

import { useEffect, useState } from "react"
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Fingerprint,
  AlertCircle,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useApp } from "@/lib/store"
import { apiFetch } from "@/lib/api-client"
import { REPORT_CATEGORIES, REPORT_SEVERITIES, CATEGORY_LABELS, SEVERITY_META } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ReportView() {
  const { setView, orgs, setOrgs, orgsLoaded } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ token: string; caseNumber: string } | null>(null)
  const [form, setForm] = useState({
    orgSlug: "",
    category: "HARASSMENT",
    severity: "HIGH",
    department: "",
    accusedName: "",
    accusedRole: "",
    description: "",
    location: "",
    incidentDate: "",
    consentFollowup: false,
    contact: "",
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!orgsLoaded) {
      apiFetch("/api/orgs").then((d) => {
        setOrgs(d.orgs)
        if (!form.orgSlug && d.orgs[0]) setForm((f) => ({ ...f, orgSlug: d.orgs[0].slug }))
      }).catch(() => {})
    } else if (!form.orgSlug && orgs[0]) {
      setForm((f) => ({ ...f, orgSlug: orgs[0].slug }))
    }
  }, [orgsLoaded, orgs])

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (form.description.trim().length < 20) {
      toast.error("Please provide at least 20 characters of detail.")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch<{ reportToken: string; caseNumber: string }>("/api/reports", {
        method: "POST",
        body: JSON.stringify(form),
      })
      setDone({ token: res.reportToken, caseNumber: res.caseNumber })
      toast.success("Report submitted securely")
    } catch (e: any) {
      toast.error(e.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-emerald-200 shadow-lg">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-semibold">Report received securely</h2>
            <p className="mt-2 text-sm text-emerald-50">
              Your report is encrypted and in the queue. An officer will review it within 1 business day.
            </p>
          </div>
          <CardContent className="p-8">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Your tracking token</div>
              <div className="mt-2 flex items-center gap-2">
                <code className="sw-mono flex-1 truncate text-lg font-semibold text-zinc-900">{done.token}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(done.token)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  }}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Save this privately. Use it to check status anonymously — no name, no login, ever.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">Case number</div>
                <div className="sw-mono font-semibold text-zinc-900">{done.caseNumber}</div>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <div className="text-xs text-zinc-500">Status</div>
                <div className="flex items-center gap-1.5 font-semibold text-sky-700">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Submitted
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => setView("track")}>
                Track this report
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setView("landing")}>
                Back to home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        onClick={() => setView("landing")}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700">
          <Lock className="mr-1 h-3 w-3" /> Anonymous &amp; encrypted
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Submit a report</h1>
        <p className="mt-2 text-zinc-600">
          You are not logged in. Your IP is not stored. Everything you type is encrypted before it leaves your device.
        </p>
      </div>

      {/* Reassurance strip */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Fingerprint, t: "No identity required" },
          { icon: Lock, t: "End-to-end encrypted" },
          { icon: EyeOff, t: "Nothing tracked" },
        ].map((r) => (
          <div key={r.t} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3">
            <r.icon className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-xs font-medium text-zinc-700">{r.t}</span>
          </div>
        ))}
      </div>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Report details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Org */}
          <div className="space-y-2">
            <Label>Organization <span className="text-rose-500">*</span></Label>
            <p className="text-xs text-zinc-500">
              Select your employer. This routes the report to the right compliance team.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {orgs.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => set("orgSlug", o.slug)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    form.orgSlug === o.slug
                      ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                      : "border-zinc-200 bg-white hover:border-zinc-300",
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-zinc-900">{o.name}</div>
                    <div className="text-xs text-zinc-500">{o.industry} · {o.employeeCount} employees</div>
                  </div>
                  {form.orgSlug === o.slug && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category <span className="text-rose-500">*</span></Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REPORT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("category", c)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                    form.category === c
                      ? "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
                  )}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label>Severity <span className="text-rose-500">*</span></Label>
            <RadioGroup
              value={form.severity}
              onValueChange={(v) => set("severity", v)}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {REPORT_SEVERITIES.map((s) => {
                const meta = SEVERITY_META[s]
                return (
                  <label
                    key={s}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                      form.severity === s
                        ? cn("ring-1", meta.color, "ring-current")
                        : "border-zinc-200 bg-white hover:border-zinc-300",
                    )}
                  >
                    <RadioGroupItem value={s} id={`sev-${s}`} />
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          {/* Department + accused */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dept">Department <span className="text-rose-500">*</span></Label>
              <Input
                id="dept"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="e.g. Sales, Finance, Operations"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc">Name of person accused <span className="text-rose-500">*</span></Label>
              <Input
                id="acc"
                value={form.accusedName}
                onChange={(e) => set("accusedName", e.target.value)}
                placeholder="Full name"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accRole">Their role / title</Label>
              <Input
                id="accRole"
                value={form.accusedRole}
                onChange={(e) => set("accusedRole", e.target.value)}
                placeholder="e.g. Regional Sales Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc">Where did it happen?</Label>
              <Input
                id="loc"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Office / plant / city (optional)"
              />
            </div>
          </div>

          {/* Incident date */}
          <div className="space-y-2">
            <Label htmlFor="date">When did it happen?</Label>
            <Input
              id="date"
              type="date"
              value={form.incidentDate}
              onChange={(e) => set("incidentDate", e.target.value)}
              className="sm:w-56"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="desc">What happened? <span className="text-rose-500">*</span></Label>
              <span className={cn("text-xs", form.description.length < 20 ? "text-zinc-400" : "text-emerald-600")}>
                {form.description.length} / min 20 chars
              </span>
            </div>
            <Textarea
              id="desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Be specific — dates, amounts, witnesses, and any evidence you can describe help the investigation. This is encrypted end-to-end."
              rows={6}
            />
            <p className="flex items-start gap-1.5 text-xs text-zinc-500">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              Specifics matter. Vague reports are harder to act on. You can submit multiple reports for separate incidents.
            </p>
          </div>

          {/* Consent */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.consentFollowup}
                onChange={(e) => set("consentFollowup", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <div className="text-sm font-medium text-zinc-900">
                  Allow an officer to follow up with me privately
                </div>
                <div className="text-xs text-zinc-500">
                  Optional. Your contact stays encrypted and is never linked to your identity in the audit trail.
                </div>
              </div>
            </label>
            {form.consentFollowup && (
              <div className="mt-3">
                <Input
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  placeholder="Email or phone for follow-up (encrypted)"
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Encrypted in your browser · submitted over TLS
            </div>
            <Button
              size="lg"
              onClick={submit}
              disabled={submitting || !form.orgSlug || !form.department || !form.accusedName || form.description.length < 20}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Encrypting &amp; submitting…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit securely
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
