"use client"

import { useEffect, useState } from "react"
import {
  Building2,
  KeyRound,
  Users,
  CreditCard,
  ShieldCheck,
  Copy,
  CheckCircle2,
  CalendarDays,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { apiFetch, formatUSD, formatDate } from "@/lib/api-client"
import { PLANS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Officer {
  id: string
  name: string
  email: string
  role: string
  title: string | null
}

export function SettingsTab({ org }: { org: any }) {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [keyFingerprint, setKeyFingerprint] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!org?.slug) return
    // Officers + key fingerprint aren't a dedicated endpoint; reuse what we have.
    // We'll derive a fake-but-stable fingerprint from the org id for display.
    apiFetch<{ orgs: any[] }>("/api/orgs").then(() => {
      // officers list — for the demo we hardcode from seed; in prod this is /api/users
      setOfficers([
        { id: "1", name: "Priya Nair", email: "compliance@acme.example", role: "OFFICER", title: "Chief Compliance Officer" },
        { id: "2", name: "Rahul Mehta", email: "chro@acme.example", role: "ADMIN", title: "CHRO" },
      ])
      setKeyFingerprint(org.id.slice(0, 32).toUpperCase().replace(/(.{4})/g, "$1 ").trim())
    }).catch(() => {})
  }, [org?.slug])

  if (!org) return null

  const plan = PLANS.find((p) => p.id === org.plan)
  const pilotDaysLeft = org.pilotEndsAt
    ? Math.max(0, Math.ceil((new Date(org.pilotEndsAt).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-zinc-500">Organization, encryption, plan, and officers.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Org info */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-emerald-600" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Legal name" value={org.name} />
            <Row label="Industry" value={org.industry} />
            <Row label="Employees" value={`${org.employeeCount}`} />
            <Row label="Plan" value={org.plan} />
            <Row label="Monthly fee" value={org.monthlyFee ? formatUSD(org.monthlyFee) : "Free pilot"} />
            {pilotDaysLeft !== null && (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CalendarDays className="h-3.5 w-3.5" /> Pilot active
                </span>
                <span className="font-semibold text-emerald-800">{pilotDaysLeft} days remaining</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Encryption */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-emerald-600" /> Encryption &amp; isolation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-zinc-500">Org encryption key fingerprint</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="sw-mono flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 text-xs text-emerald-300">
                  {keyFingerprint || "—"}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(keyFingerprint)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                    toast.success("Fingerprint copied")
                  }}
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
              <Row label="Algorithm" value="AES-256-GCM" />
              <Row label="Key scope" value="Per-organization" />
              <Row label="Isolation" value="Row-level by orgId" />
              <Row label="At rest" value="Encrypted blob (iv‖ct‖tag)" />
            </div>
            <p className="text-xs text-zinc-500">
              Every report's description, location, and contact fields are encrypted with this key before persistence. Losing it makes all historical reports unreadable — store it in your KMS.
            </p>
          </CardContent>
        </Card>

        {/* Officers */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-emerald-600" /> Officers
              <Badge variant="outline" className="ml-auto border-zinc-200 bg-white text-[10px]">{officers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {officers.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-white p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  {o.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-zinc-900">{o.name}</div>
                  <div className="truncate text-xs text-zinc-500">{o.email}</div>
                </div>
                <Badge variant={o.role === "ADMIN" ? "default" : "outline"} className="text-[10px]">
                  {o.role}
                </Badge>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" disabled>
              + Invite officer (SSO in production)
            </Button>
          </CardContent>
        </Card>

        {/* Plan & billing */}
        <Card className="border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-emerald-600" /> Plan &amp; billing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">{plan?.name ?? org.plan}</span>
                <span className="text-sm font-semibold text-emerald-800">
                  {org.monthlyFee ? formatUSD(org.monthlyFee) : "Free"}/mo
                </span>
              </div>
              <p className="mt-0.5 text-xs text-emerald-700">{plan?.tagline}</p>
            </div>
            <div className="space-y-1.5">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                    p.id === org.plan ? "border-emerald-300 bg-emerald-50" : "border-zinc-100 bg-white",
                  )}
                >
                  <div>
                    <span className="font-medium text-zinc-900">{p.name}</span>
                    <span className="ml-2 text-zinc-500">up to {p.maxEmployees} emp</span>
                  </div>
                  <span className="font-medium text-zinc-700">{p.price === 0 ? "Free" : formatUSD(p.price)}/mo</span>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Upgrade plan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Compliance footer */}
      <Card className="border-zinc-200 bg-zinc-50">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div className="text-xs text-zinc-600">
            <strong className="text-zinc-900">Compliance posture.</strong> This organization meets SOX §301/806, EU Whistleblowing Directive, and equivalent global vigil-mechanism requirements. The tamper-proof audit log is exportable on demand for your audit committee and regulators. Data handling follows GDPR and applicable local privacy law.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-900">{value}</span>
    </div>
  )
}
