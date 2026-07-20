import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateOrgKey } from "@/lib/encryption"
import { appendAudit } from "@/lib/audit-write"

// List orgs (public slugs only — for the report submission dropdown + demo dashboard switcher).
export async function GET() {
  const orgs = await db.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
      employeeCount: true,
      plan: true,
      monthlyFee: true,
      pilotStartsAt: true,
      pilotEndsAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ orgs })
}

// Provision a new org (onboarding flow). Generates a per-org encryption key.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const name = (body.name as string)?.trim()
  const industry = (body.industry as string)?.trim() || "General"
  const employeeCount = Number(body.employeeCount) || 0
  const plan = (body.plan as string) || "PILOT"

  if (!name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 })

  const slug =
    (body.slug as string)?.trim().toLowerCase() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6)

  const existing = await db.organization.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 })

  const feeMap: Record<string, number> = { PILOT: 0, GROWTH: 15000, SCALE: 25000, ENTERPRISE: 40000 }
  const now = new Date()
  const org = await db.organization.create({
    data: {
      name,
      slug,
      industry,
      employeeCount,
      plan,
      monthlyFee: feeMap[plan] ?? 0,
      pilotStartsAt: plan === "PILOT" ? now : null,
      pilotEndsAt: plan === "PILOT" ? new Date(now.getTime() + 60 * 86400000) : null,
      encKeyB64: generateOrgKey(),
    },
  })

  // Genesis audit entry
  await appendAudit({
    orgId: org.id,
    actorType: "SYSTEM",
    action: "ORG_CREATED",
    payload: JSON.stringify({ name, plan, employeeCount }),
    timestamp: now,
  })

  return NextResponse.json({ ok: true, org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan } })
}
