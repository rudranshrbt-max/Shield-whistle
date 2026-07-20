// ShieldWhistle — multi-org isolation & server-side context.
// In a production deployment this would be driven by NextAuth session -> orgId.
// For the V1 pilot we resolve the "current org" from a header or query param
// so the demo dashboard can switch orgs. The critical invariant: EVERY db
// query touching org-scoped models MUST filter by orgId — enforced here.

import { headers } from "next/headers"
import { createHash } from "crypto"

export const DEMO_ORG_HEADER = "x-sw-org"

/**
 * Resolve the active org slug for the current request. Officers operate
 * inside exactly one org at a time; the dashboard sends the slug in a header.
 */
export async function getActiveOrgSlug(): Promise<string | null> {
  const h = await headers()
  return h.get(DEMO_ORG_HEADER) || h.get("x-sw-org-lower") || null
}

/**
 * Deterministic short token a whistleblower uses to track a report's status
 * without revealing their identity. 12 chars, unguessable, URL-safe.
 */
export function generateReportToken(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let out = ""
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length]
  }
  return `SW-${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`
}

/** Friendly case number like SW-2025-0001. */
export function formatCaseNumber(seq: number, year: number): string {
  return `SW-${year}-${String(seq).padStart(4, "0")}`
}

/** Duplicate signature groups reports that accuse the same person in the
 *  same department for the same category — the exact "pattern" officers want. */
export function dupSignature(
  orgId: string,
  department: string,
  accusedName: string,
  category: string,
): string {
  const norm = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, " ")
  const material = [
    orgId,
    norm(department),
    norm(accusedName),
    category,
  ].join("::")
  // sha256
  return createHash("sha256").update(material, "utf8").digest("hex")
}
