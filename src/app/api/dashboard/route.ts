import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"

// Dashboard KPIs + breakdowns for the active org's compliance officer.
export async function GET() {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const [total, byStatus, bySeverity, byChannel, byCategory, recent, openCases, criticalOpen, resolved30d] =
    await Promise.all([
      db.case.count({ where: { orgId: org.id } }),
      db.case.groupBy({ by: ["status"], where: { orgId: org.id }, _count: true }),
      db.report.groupBy({ by: ["severity"], where: { orgId: org.id }, _count: true }),
      db.report.groupBy({ by: ["channel"], where: { orgId: org.id }, _count: true }),
      db.report.groupBy({ by: ["category"], where: { orgId: org.id }, _count: true }),
      db.case.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { report: true, assignee: true },
      }),
      db.case.count({ where: { orgId: org.id, status: { in: ["SUBMITTED", "REVIEWING"] } } }),
      db.case.count({
        where: { orgId: org.id, status: { in: ["SUBMITTED", "REVIEWING"] }, priority: "CRITICAL" },
      }),
      db.case.count({
        where: { orgId: org.id, status: "RESOLVED", resolvedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
    ])

  // compute avg resolution hours manually (sqlite-friendly)
  const resolved = await db.case.findMany({
    where: { orgId: org.id, status: "RESOLVED", resolvedAt: { not: null } },
    select: { createdAt: true, resolvedAt: true },
  })
  const avgHours =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((acc, c) => {
            const hrs = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / 3_600_000
            return acc + hrs
          }, 0) / resolved.length,
        )
      : 0

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      industry: org.industry,
      employeeCount: org.employeeCount,
      plan: org.plan,
      monthlyFee: org.monthlyFee,
      pilotEndsAt: org.pilotEndsAt,
    },
    kpis: {
      totalCases: total,
      openCases,
      criticalOpen,
      resolved30d,
      avgResolutionHours: avgHours,
    },
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
    byChannel: byChannel.map((s) => ({ channel: s.channel, count: s._count })),
    byCategory: byCategory.map((s) => ({ category: s.category, count: s._count })),
    recent: recent.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      status: c.status,
      priority: c.priority,
      createdAt: c.createdAt,
      category: c.report.category,
      severity: c.report.severity,
      department: c.report.department,
      accusedName: c.report.accusedName,
      channel: c.report.channel,
      assignee: c.assignee?.name ?? null,
    })),
  })
}
