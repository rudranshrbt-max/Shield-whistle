import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"

// WhatsApp integration status for the dashboard. In production this would
// reflect a live Twilio / WhatsApp Business API connection; for the pilot we
// surface the connected number, recent sessions, and reports received via
// the channel.
export async function GET() {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const [sessions, whatsappReports] = await Promise.all([
    db.whatsappSession.count({ where: { orgId: org.id } }),
    db.report.count({ where: { orgId: org.id, channel: "WHATSAPP" } }),
  ])

  // Deterministic demo number per org (so it's stable across reloads)
  const demoNumber = `+1 ${100 + (org.id.charCodeAt(0) % 899)}-${String(100 + (org.id.charCodeAt(1) % 899))}-${String(1000 + (org.id.charCodeAt(2) % 8999))}`

  return NextResponse.json({
    connected: true,
    provider: "WhatsApp Business API (Twilio)",
    number: demoNumber,
    templateApproved: true,
    sessions,
    whatsappReports,
    webhookUrl: `/api/whatsapp/inbound`,
    lastPing: new Date().toISOString(),
  })
}
