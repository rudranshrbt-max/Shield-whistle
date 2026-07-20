import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
import { generateReportToken, dupSignature } from "@/lib/org"
import { appendAudit } from "@/lib/audit-write"
import { REPORT_CATEGORIES, REPORT_SEVERITIES } from "@/lib/constants"

// Anonymous report submission (web channel). The whistleblower selects their
// org from a public dropdown — we never ask for identity.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const orgSlug = body.orgSlug as string | undefined
  const category = body.category as string
  const severity = body.severity as string
  const department = (body.department as string)?.trim()
  const accusedName = (body.accusedName as string)?.trim()
  const accusedRole = (body.accusedRole as string)?.trim() || "Unknown"
  const description = (body.description as string)?.trim()
  const location = (body.location as string)?.trim() || ""
  const incidentDate = body.incidentDate as string | undefined
  const contact = (body.contact as string)?.trim() || ""
  const consentFollowup = Boolean(body.consentFollowup)
  const channel = body.channel === "WHATSAPP" ? "WHATSAPP" : "WEB"

  if (!orgSlug || !category || !department || !accusedName || !description) {
    return NextResponse.json(
      { error: "Missing required fields (org, category, department, accused, description)" },
      { status: 400 },
    )
  }
  if (!REPORT_CATEGORIES.includes(category as never)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }
  if (severity && !REPORT_SEVERITIES.includes(severity as never)) {
    return NextResponse.json({ error: "Invalid severity" }, { status: 400 })
  }
  if (description.length < 20) {
    return NextResponse.json({ error: "Please provide at least 20 characters of detail." }, { status: 400 })
  }

  const org = await db.organization.findUnique({ where: { slug: orgSlug } })
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  const token = generateReportToken()
  const sig = dupSignature(org.id, department, accusedName, category)
  const submittedAt = new Date()

  const report = await db.report.create({
    data: {
      orgId: org.id,
      reportToken: token,
      channel,
      category,
      severity: severity || "MEDIUM",
      department,
      accusedName,
      accusedRole,
      encDescription: encrypt(description, org.encKeyB64),
      encLocation: location ? encrypt(location, org.encKeyB64) : null,
      incidentDate: incidentDate ? new Date(incidentDate) : null,
      encContact: contact ? encrypt(contact, org.encKeyB64) : null,
      anonymous: true,
      consentFollowup,
      status: "SUBMITTED",
      dupSignature: sig,
      submittedAt,
    },
  })

  // Auto-create a case
  const year = submittedAt.getFullYear()
  const count = await db.case.count({ where: { orgId: org.id } })
  const caseNumber = `SW-${year}-${String(count + 1).padStart(4, "0")}`

  const caseRec = await db.case.create({
    data: {
      orgId: org.id,
      caseNumber,
      reportId: report.id,
      status: "SUBMITTED",
      priority: severity === "CRITICAL" ? "HIGH" : severity || "MEDIUM",
      createdAt: submittedAt,
      updatedAt: submittedAt,
    },
  })

  // Hash-chained audit entries (transactional, seq-ordered)
  await appendAudit({
    orgId: org.id, reportId: report.id, caseId: caseRec.id,
    actorType: "WHISTLEBLOWER",
    action: channel === "WHATSAPP" ? "WHATSAPP_REPORT" : "REPORT_SUBMITTED",
    payload: JSON.stringify({ reportToken: token, channel, category }),
    timestamp: submittedAt,
  })
  await appendAudit({
    orgId: org.id, reportId: report.id, caseId: caseRec.id,
    actorType: "SYSTEM", action: "CASE_CREATED",
    payload: JSON.stringify({ caseNumber }),
    timestamp: new Date(submittedAt.getTime() + 1000),
  })

  return NextResponse.json({
    ok: true,
    reportToken: token,
    caseNumber,
    message: "Your report was received securely. Save your tracking token to check status anonymously.",
  })
}
