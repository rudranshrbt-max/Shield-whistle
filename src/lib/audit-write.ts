// ShieldWhistle — append-only audit writer.
// Centralizes hash-chain extension in a single transactional helper so every
// audit entry (across reports, cases, messages, orgs) chains correctly to the
// true previous entry. We order by `seq` (monotonic, computed as max+1) rather
// than `timestamp`, which eliminates the fork-on-tie bug that broke the chain
// when multiple entries were written in the same millisecond.

import { db } from "@/lib/db"
import { computeAuditHash } from "@/lib/audit"

export async function appendAudit(params: {
  orgId: string
  caseId?: string | null
  reportId?: string | null
  actorType?: string
  actorEmail?: string | null
  action: string
  payload: string
  timestamp?: Date
}) {
  return db.$transaction(async (tx) => {
    const last = await tx.auditLog.findFirst({
      where: { orgId: params.orgId },
      orderBy: { seq: "desc" },
    })
    const prevHash = last?.hash ?? "GENESIS"
    const seq = (last?.seq ?? 0) + 1
    const ts = params.timestamp ?? new Date()
    const hash = computeAuditHash(prevHash, params.action, params.payload, ts.toISOString(), params.orgId)
    return tx.auditLog.create({
      data: {
        seq,
        orgId: params.orgId,
        caseId: params.caseId ?? null,
        reportId: params.reportId ?? null,
        actorType: params.actorType ?? "SYSTEM",
        actorEmail: params.actorEmail ?? null,
        action: params.action,
        payload: params.payload,
        prevHash,
        hash,
        timestamp: ts,
      },
    })
  })
}
