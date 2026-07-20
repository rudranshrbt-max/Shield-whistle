import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"
import { tryDecrypt } from "@/lib/encryption"
import { computeAuditHash } from "@/lib/audit"

// Case inbox for the active org. Supports filtering by status, severity,
// category, channel, and a free-text search over department / accused.
export async function GET(req: NextRequest) {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const sp = req.nextUrl.searchParams
  const status = sp.get("status") // SUBMITTED | REVIEWING | RESOLVED | all
  const severity = sp.get("severity")
  const category = sp.get("category")
  const channel = sp.get("channel")
  const q = sp.get("q")?.trim()
  const sort = sp.get("sort") || "newest" // newest | oldest | priority

  const where: any = { orgId: org.id }
  if (status && status !== "all") where.status = status
  if (severity && severity !== "all") where.report = { severity }
  if (category && category !== "all") where.report = { ...(where.report || {}), category }
  if (channel && channel !== "all") where.report = { ...(where.report || {}), channel }
  if (q) {
    where.OR = [
      { report: { department: { contains: q } } },
      { report: { accusedName: { contains: q } } },
      { report: { accusedRole: { contains: q } } },
      { caseNumber: { contains: q } },
    ]
  }

  const priorityRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "priority"
        ? { createdAt: "desc" as const }
        : { createdAt: "desc" as const }

  const cases = await db.case.findMany({
    where,
    orderBy,
    include: { report: true, assignee: true },
    take: 200,
  })

  const list = cases.map((c) => ({
    id: c.id,
    caseNumber: c.caseNumber,
    status: c.status,
    priority: c.priority,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    resolvedAt: c.resolvedAt,
    assignee: c.assignee?.name ?? null,
    report: {
      category: c.report.category,
      severity: c.report.severity,
      channel: c.report.channel,
      department: c.report.department,
      accusedName: c.report.accusedName,
      accusedRole: c.report.accusedRole,
      incidentDate: c.report.incidentDate,
      submittedAt: c.report.submittedAt,
    },
  }))

  // priority sort applied in JS (sqlite can't order by enum rank easily)
  if (sort === "priority") {
    list.sort((a, b) => {
      const r = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9)
      if (r !== 0) return r
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }

  return NextResponse.json({ cases: list, count: list.length })
}
