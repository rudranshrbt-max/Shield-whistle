import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"
import { tryDecrypt, encrypt } from "@/lib/encryption"
import { appendAudit } from "@/lib/audit-write"

// Full case detail — decrypts the report content for the officer.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const { id } = await params
  const c = await db.case.findFirst({
    where: { id, orgId: org.id },
    include: {
      report: true,
      assignee: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  })
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 })

  // Record a "decrypted & viewed" audit entry (proves access for compliance)
  await appendAudit({
    orgId: org.id, caseId: c.id, reportId: c.reportId,
    actorType: "OFFICER", actorEmail: "officer@demo",
    action: "REPORT_VIEWED",
    payload: JSON.stringify({ caseId: c.id, caseNumber: c.caseNumber }),
  })

  return NextResponse.json({
    id: c.id,
    caseNumber: c.caseNumber,
    status: c.status,
    priority: c.priority,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    resolvedAt: c.resolvedAt,
    resolution: c.resolution,
    assignee: c.assignee ? { id: c.assignee.id, name: c.assignee.name, title: c.assignee.title } : null,
    report: {
      reportToken: c.report.reportToken,
      category: c.report.category,
      severity: c.report.severity,
      channel: c.report.channel,
      department: c.report.department,
      accusedName: c.report.accusedName,
      accusedRole: c.report.accusedRole,
      description: tryDecrypt(c.report.encDescription, org.encKeyB64),
      location: c.report.encLocation ? tryDecrypt(c.report.encLocation, org.encKeyB64) : null,
      incidentDate: c.report.incidentDate,
      submittedAt: c.report.submittedAt,
      anonymous: c.report.anonymous,
      consentFollowup: c.report.consentFollowup,
      contact: c.report.encContact ? tryDecrypt(c.report.encContact, org.encKeyB64) : null,
    },
    messages: c.messages.map((m) => ({
      id: m.id,
      authorRole: m.authorRole,
      content: tryDecrypt(m.encContent, org.encKeyB64),
      createdAt: m.createdAt,
    })),
  })
}

// Update case: status / priority / assignee / resolution. Appends audit entries.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const c = await db.case.findFirst({ where: { id, orgId: org.id } })
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 })

  const updates: any = { updatedAt: new Date() }
  const audits: { action: string; payload: any }[] = []

  if (body.status && body.status !== c.status) {
    audits.push({ action: "STATUS_CHANGED", payload: { from: c.status, to: body.status } })
    updates.status = body.status
    if (body.status === "RESOLVED") {
      updates.resolvedAt = new Date()
      if (body.resolution) {
        updates.resolution = body.resolution
        audits.push({ action: "CASE_RESOLVED", payload: { resolution: body.resolution } })
      } else {
        audits.push({ action: "CASE_RESOLVED", payload: { resolution: c.resolution || "Resolved." } })
      }
    } else if (body.status === "REVIEWING" && c.status === "RESOLVED") {
      audits.push({ action: "CASE_REOPENED", payload: {} })
      updates.resolvedAt = null
    }
  }
  if (body.priority && body.priority !== c.priority) {
    audits.push({ action: "PRIORITY_CHANGED", payload: { from: c.priority, to: body.priority } })
    updates.priority = body.priority
  }
  if (body.assigneeId !== undefined && body.assigneeId !== c.assignedTo) {
    audits.push({
      action: c.assignedTo ? "CASE_REASSIGNED" : "CASE_ASSIGNED",
      payload: { from: c.assignedTo, to: body.assigneeId },
    })
    updates.assignedTo = body.assigneeId || null
  }

  await db.case.update({ where: { id }, data: updates })

  // append chained audit entries (each appendAudit re-reads the true head in a
  // transaction, so the chain stays intact even when multiple are written)
  for (const a of audits) {
    await appendAudit({
      orgId: org.id, caseId: c.id, reportId: c.reportId,
      actorType: "OFFICER", actorEmail: "officer@demo",
      action: a.action,
      payload: JSON.stringify(a.payload),
    })
  }

  return NextResponse.json({ ok: true })
}
