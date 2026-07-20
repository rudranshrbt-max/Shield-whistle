import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"

// Duplicate pattern detection: groups reports by (department + accused + category)
// and surfaces groups with 2+ reports — the exact signal an officer wants when
// the same person is being reported repeatedly.
export async function GET() {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const reports = await db.report.findMany({
    where: { orgId: org.id },
    select: {
      id: true,
      dupSignature: true,
      department: true,
      accusedName: true,
      accusedRole: true,
      category: true,
      severity: true,
      status: true,
      channel: true,
      submittedAt: true,
      case: { select: { caseNumber: true, status: true } },
    },
    orderBy: { submittedAt: "asc" },
  })

  const groups = new Map<
    string,
    {
      signature: string
      department: string
      accusedName: string
      accusedRole: string
      category: string
      reports: typeof reports
    }
  >()

  for (const r of reports) {
    const sig = r.dupSignature
    if (!groups.has(sig)) {
      groups.set(sig, {
        signature: sig,
        department: r.department,
        accusedName: r.accusedName,
        accusedRole: r.accusedRole,
        category: r.category,
        reports: [],
      })
    }
    groups.get(sig)!.reports.push(r)
  }

  const duplicates = [...groups.values()]
    .filter((g) => g.reports.length >= 2)
    .map((g) => {
      const sevRank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      const topSeverity = g.reports
        .map((r) => r.severity)
        .sort((a, b) => (sevRank[a] ?? 9) - (sevRank[b] ?? 9))[0]
      const open = g.reports.filter((r) => r.status !== "RESOLVED").length
      return {
        signature: g.signature,
        department: g.department,
        accusedName: g.accusedName,
        accusedRole: g.accusedRole,
        category: g.category,
        count: g.reports.length,
        openCount: open,
        topSeverity,
        firstReportedAt: g.reports[0].submittedAt,
        lastReportedAt: g.reports[g.reports.length - 1].submittedAt,
        reports: g.reports.map((r) => ({
          id: r.id,
          caseNumber: r.case?.caseNumber,
          status: r.status,
          severity: r.severity,
          channel: r.channel,
          submittedAt: r.submittedAt,
        })),
      }
    })
    .sort((a, b) => b.count - a.count || b.openCount - a.openCount)

  return NextResponse.json({
    duplicates,
    totalGroups: duplicates.length,
    totalFlaggedReports: duplicates.reduce((acc, g) => acc + g.count, 0),
  })
}
