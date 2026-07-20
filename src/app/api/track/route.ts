import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Track a report anonymously by token (no org needed — token is globally unique).
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim()
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const report = await db.report.findUnique({
    where: { reportToken: token },
    include: { case: true },
  })
  if (!report) return NextResponse.json({ error: "No report found for that token" }, { status: 404 })

  return NextResponse.json({
    reportToken: report.reportToken,
    status: report.status,
    category: report.category,
    severity: report.severity,
    channel: report.channel,
    submittedAt: report.submittedAt,
    caseNumber: report.case?.caseNumber ?? null,
    resolution: report.case?.resolution ?? null,
    updatedAt: report.case?.updatedAt ?? report.updatedAt,
  })
}
