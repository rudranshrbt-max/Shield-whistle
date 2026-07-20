"use client"

import { useEffect, useState } from "react"
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Webhook,
  Loader2,
  ArrowRight,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api-client"
import { WhatsappSimulator } from "./whatsapp-simulator"
import { useApp } from "@/lib/store"

interface WaStatus {
  connected: boolean
  provider: string
  number: string
  templateApproved: boolean
  sessions: number
  whatsappReports: number
  webhookUrl: string
  lastPing: string
}

export function WhatsappTab({ orgSlug }: { orgSlug: string }) {
  const [status, setStatus] = useState<WaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const setView = useApp((s) => s.setView)

  useEffect(() => {
    apiFetch<WaStatus>("/api/whatsapp", { orgSlug })
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [orgSlug])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">WhatsApp integration</h1>
        <p className="text-sm text-zinc-500">
          Your differentiator. Employees report over a channel they already trust — no app, no login.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CheckCircle2, label: "Connection", value: status?.connected ? "Connected" : "—", color: "text-emerald-600 bg-emerald-50 ring-emerald-100" },
          { icon: MessageSquare, label: "WhatsApp reports", value: status?.whatsappReports ?? "—", color: "text-green-600 bg-green-50 ring-green-100" },
          { icon: Phone, label: "Connected number", value: status?.number ?? "—", color: "text-sky-600 bg-sky-50 ring-sky-100", mono: true },
          { icon: Webhook, label: "Template status", value: status?.templateApproved ? "Approved" : "—", color: "text-violet-600 bg-violet-50 ring-violet-100" },
        ].map((c) => (
          <Card key={c.label} className="border-zinc-200">
            <CardContent className="p-4">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg ring-1", c.color)}>
                <c.icon className="h-4 w-4" />
              </div>
              <div className={cn("mt-3 text-sm font-semibold text-zinc-900", c.mono && "sw-mono")}>{c.value}</div>
              <div className="text-xs text-zinc-500">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Live simulator */}
        <Card className="border-zinc-200 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" /> Live bot simulator
              </span>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                real socket.io · port 3003
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsappSimulator orgSlug={orgSlug} />
            <p className="mt-2 text-xs text-zinc-500">
              This is the actual bot your employees would message. Try filing a real report — it will create a live case in your inbox.
            </p>
          </CardContent>
        </Card>

        {/* Integration details */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Integration details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </div>
              ) : status ? (
                <>
                  <Row label="Provider" value={status.provider} />
                  <Row label="Phone number" value={status.number} mono />
                  <Row label="Template" value={status.templateApproved ? "Approved ✓" : "Pending"} />
                  <Row label="Sessions" value={String(status.sessions)} />
                  <Row label="Webhook URL" value={status.webhookUrl} mono />
                  <Row label="Last ping" value={new Date(status.lastPing).toLocaleTimeString()} />
                </>
              ) : (
                <p className="text-xs text-zinc-400">Unable to load status.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <ShieldCheck className="h-4 w-4" /> Privacy guarantees
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-emerald-700">
                <li>• Phone numbers are one-way hashed (SHA-256), never stored in plaintext</li>
                <li>• Report content is encrypted with your org's AES-256 key</li>
                <li>• Officers see the report, not the reporter's number</li>
                <li>• Every submission creates an identical audit entry to web reports</li>
              </ul>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" onClick={() => setView("landing")}>
            <ExternalLink className="mr-1.5 h-4 w-4" /> See how it works for employees
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-medium text-zinc-900 ${mono ? "sw-mono" : ""}`}>{value}</span>
    </div>
  )
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ")
}
