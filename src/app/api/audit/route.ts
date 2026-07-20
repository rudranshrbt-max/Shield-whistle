import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveOrg } from "@/lib/server-org"
import { verifyChain } from "@/lib/audit"

// Tamper-proof audit log. Returns filtered entries (newest first) for display,
// but ALWAYS verifies integrity against the FULL hash chain (ignoring filters)
// — otherwise a case-scoped view would falsely report a broken chain.
export async function GET(req: NextRequest) {
  const { org, error } = await resolveOrg()
  if (!org) return NextResponse.json({ error }, { status: 400 })

  const sp = req.nextUrl.searchParams
  const caseId = sp.get("caseId")
  const action = sp.get("action")
  const limit = Math.min(Number(sp.get("limit")) || 200, 500)

  // 1) Full chain (seq-ordered) for integrity verification.
  const fullChain = await db.auditLog.findMany({
    where: { orgId: org.id },
    orderBy: { seq: "asc" },
  })
  const verification = verifyChain(fullChain)
  const headHash = fullChain.at(-1)?.hash ?? "GENESIS"

  // 2) Filtered + reversed (newest first) for display.
  const filtered = fullChain.filter((e) => {
    if (caseId && e.caseId !== caseId) return false
    if (action && action !== "all" && e.action !== action) return false
    return true
  })
  const entries = filtered
    .slice(-limit)
    .reverse()
    .map((e) => ({
      id: e.id,
      seq: e.seq,
      caseId: e.caseId,
      reportId: e.reportId,
      actorType: e.actorType,
      actorEmail: e.actorEmail,
      action: e.action,
      payload: e.payload,
      prevHash: e.prevHash,
      hash: e.hash,
      timestamp: e.timestamp,
    }))

  return NextResponse.json({
    entries,
    count: entries.length,
    totalCount: fullChain.length,
    verification,
    headHash,
  })
}
