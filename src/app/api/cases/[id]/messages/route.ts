import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"
import { encrypt } from "@/lib/encryption"
import { appendAudit } from "@/lib/audit-write"

// Add an internal officer note to a case (encrypted at rest).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.content) return NextResponse.json({ error: "content is required" }, { status: 400 })

  const c = await db.case.findFirst({ where: { id, orgId: org.id } })
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 })

  const content = String(body.content).trim()
  if (content.length < 1) return NextResponse.json({ error: "Note cannot be empty" }, { status: 400 })

  const msg = await db.caseMessage.create({
    data: {
      caseId: c.id,
      authorRole: "OFFICER",
      encContent: encrypt(content, org.encKeyB64),
    },
  })

  // audit
  await appendAudit({
    orgId: org.id, caseId: c.id, reportId: c.reportId,
    actorType: "OFFICER", actorEmail: "officer@demo",
    action: "MESSAGE_ADDED",
    payload: JSON.stringify({ caseId: c.id, messageId: msg.id }),
  })

  await db.case.update({ where: { id: c.id }, data: { updatedAt: new Date() } })

  return NextResponse.json({ ok: true, messageId: msg.id })
}
