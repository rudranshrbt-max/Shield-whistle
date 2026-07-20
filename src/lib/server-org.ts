// ShieldWhistle — server-side org resolution helper.
// Resolves the active org from the x-sw-org header (slug) and returns the
// full org record including its encryption key. Used by every officer API.

import { headers } from "next/headers"
import { db } from "@/lib/db"

export async function resolveOrg() {
  const h = await headers()
  const slug = h.get("x-sw-org")
  if (!slug) return { org: null, error: "Missing x-sw-org header" as const }
  const org = await db.organization.findUnique({ where: { slug } })
  if (!org) return { org: null, error: "Organization not found" as const }
  return { org, error: null as const }
}

export type ResolvedOrg = Awaited<ReturnType<typeof resolveOrg>>
