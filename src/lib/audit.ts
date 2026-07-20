// ShieldWhistle — tamper-proof audit log.
// Every audit entry stores prevHash + hash, where
//   hash = sha256(prevHash + action + payload + timestampIso + orgId)
// Recomputing the chain on read reveals any tampering. This is what we show
// a global regulator to prove the compliance trail is intact.

import crypto from "crypto"

export function computeAuditHash(
  prevHash: string,
  action: string,
  payload: string,
  timestampIso: string,
  orgId: string,
): string {
  const material = [prevHash, action, payload, timestampIso, orgId].join("|")
  return crypto.createHash("sha256").update(material, "utf8").digest("hex")
}

export interface ChainVerification {
  ok: boolean
  brokenAtId?: string
  detail: string
}

/**
 * Walk an ordered list of audit entries (oldest -> newest) and verify every
 * hash matches the recomputed value AND links to the previous entry's hash.
 */
export function verifyChain(
  entries: {
    id: string
    prevHash: string
    hash: string
    action: string
    payload: string
    timestamp: Date
    orgId: string
  }[],
): ChainVerification {
  if (entries.length === 0) return { ok: true, detail: "No entries to verify." }

  let prev = "GENESIS"
  for (const e of entries) {
    if (e.prevHash !== prev) {
      return {
        ok: false,
        brokenAtId: e.id,
        detail: `Broken link at ${e.id}: prevHash mismatch (expected ${prev.slice(0, 10)}…, got ${e.prevHash.slice(0, 10)}…).`,
      }
    }
    const recomputed = computeAuditHash(
      e.prevHash,
      e.action,
      e.payload,
      e.timestamp.toISOString(),
      e.orgId,
    )
    if (recomputed !== e.hash) {
      return {
        ok: false,
        brokenAtId: e.id,
        detail: `Tampered entry ${e.id}: stored hash does not match recomputed hash. Content was modified after it was written.`,
      }
    }
    prev = e.hash
  }
  return {
    ok: true,
    detail: `Chain intact — ${entries.length} entries verified, head hash ${prev.slice(0, 12)}…`,
  }
}
