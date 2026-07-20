// ShieldWhistle — seed script.
// Provisions a demo organization ("Acme Industries Pvt Ltd") with officers,
// a sample of reports (some creating a duplicate pattern), cases, and a
// hash-chained audit log. Run with: bun run prisma/seed.ts

import { db } from "../src/lib/db"
import { generateOrgKey, encrypt, hashPhone } from "../src/lib/encryption"
import { generateReportToken, formatCaseNumber, dupSignature } from "../src/lib/org"
import { appendAudit } from "../src/lib/audit-write"

async function main() {
  console.log("🌱 Seeding ShieldWhistle…")

  // Wipe (dev only)
  await db.whatsappSession.deleteMany()
  await db.auditLog.deleteMany()
  await db.caseMessage.deleteMany()
  await db.case.deleteMany()
  await db.report.deleteMany()
  await db.user.deleteMany()
  await db.organization.deleteMany()

  const encKey = generateOrgKey()

  const org = await db.organization.create({
    data: {
      name: "Acme Industries Pvt Ltd",
      slug: "acme",
      industry: "Manufacturing",
      employeeCount: 740,
      plan: "GROWTH",
      monthlyFee: 15000,
      pilotStartsAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      pilotEndsAt: new Date(Date.now() + 48 * 24 * 60 * 60 * 1000),
      encKeyB64: encKey,
    },
  })
  console.log(`  ✓ Org: ${org.name} (${org.slug})`)

  const officer = await db.user.create({
    data: {
      orgId: org.id,
      email: "compliance@acme.example",
      name: "Priya Nair",
      role: "OFFICER",
      title: "Chief Compliance Officer",
    },
  })
  const admin = await db.user.create({
    data: {
      orgId: org.id,
      email: "chro@acme.example",
      name: "Rahul Mehta",
      role: "ADMIN",
      title: "CHRO",
    },
  })
  console.log(`  ✓ Officers: ${officer.name}, ${admin.name}`)

  // --- Reports ---------------------------------------------------------
  const now = new Date()
  const year = now.getFullYear()

  type Seed = {
    daysAgo: number
    channel: "WEB" | "WHATSAPP"
    category: string
    severity: string
    department: string
    accusedName: string
    accusedRole: string
    description: string
    location?: string
    status: string
    incidentDaysAgo: number
  }

  const seeds: Seed[] = [
    {
      daysAgo: 18, channel: "WEB", category: "BRIBERY", severity: "HIGH",
      department: "Procurement", accusedName: "Vikram Shah", accusedRole: "Head of Procurement",
      description: "Vendor Global Supplies Inc. was awarded the Q3 raw material contract despite being 18% more expensive than the lowest bidder. I overheard Vikram mention 'the arrangement is sorted' on a call. Invoices show inflated quantities that don't match delivery notes.",
      location: "Mumbai HO, Floor 4", status: "REVIEWING", incidentDaysAgo: 35,
    },
    {
      daysAgo: 14, channel: "WHATSAPP", category: "HARASSMENT", severity: "HIGH",
      department: "Sales", accusedName: "Anil Kapoor", accusedRole: "Regional Sales Manager",
      description: "Anil repeatedly makes inappropriate comments about female team members during weekly huddles. Two colleagues have left the team in the last quarter citing this. HR was informed informally but no action taken.",
      location: "Bengaluru regional office", status: "REVIEWING", incidentDaysAgo: 60,
    },
    {
      daysAgo: 9, channel: "WEB", category: "HARASSMENT", severity: "MEDIUM",
      department: "Sales", accusedName: "Anil Kapoor", accusedRole: "Regional Sales Manager",
      description: "Same manager as my earlier report — the behaviour has continued despite the complaint. Yesterday he blocked a colleague's promotion when she rejected his dinner invitation. This is the third incident I'm aware of.",
      status: "SUBMITTED", incidentDaysAgo: 3,
    },
    {
      daysAgo: 7, channel: "WEB", category: "FINANCIAL_MISSTATEMENT", severity: "CRITICAL",
      department: "Finance", accusedName: "Sunita Rao", accusedRole: "CFO",
      description: "Revenue for the recently concluded quarter appears to be recognised prematurely to meet guidance. There are side letters with two large distributors allowing returns that were not booked as provisions. This will materially misstate results ahead of the board meeting.",
      status: "REVIEWING", incidentDaysAgo: 10,
    },
    {
      daysAgo: 5, channel: "WHATSAPP", category: "DISCRIMINATION", severity: "MEDIUM",
      department: "Operations", accusedName: "Mahesh Iyer", accusedRole: "Plant Manager",
      description: "Contract workers from a particular state are systematically assigned the night shift and denied the statutory canteen allowance given to others. This has been going on for over six months at the Pune plant.",
      location: "Pune Plant 2", status: "SUBMITTED", incidentDaysAgo: 90,
    },
    {
      daysAgo: 3, channel: "WEB", category: "DATA_PRIVACY", severity: "HIGH",
      department: "IT", accusedName: "Deepak Menon", accusedRole: "IT Head",
      description: "Customer KYC documents including PAN and Aadhaar copies are being stored on an unsecured shared drive accessible to the entire sales team. This violates the DPDP Act and risks a massive data breach.",
      status: "REVIEWING", incidentDaysAgo: 14,
    },
    {
      daysAgo: 1, channel: "WEB", category: "WORKPLACE_SAFETY", severity: "HIGH",
      department: "Operations", accusedName: "Mahesh Iyer", accusedRole: "Plant Manager",
      description: "Two workers suffered minor injuries last week because a safety guard on press machine #4 was removed to 'improve throughput'. The guard has still not been reinstated despite the incident report filed internally.",
      location: "Pune Plant 2", status: "SUBMITTED", incidentDaysAgo: 6,
    },
    {
      daysAgo: 21, channel: "WEB", category: "CONFLICT_OF_INTEREST", severity: "MEDIUM",
      department: "Procurement", accusedName: "Vikram Shah", accusedRole: "Head of Procurement",
      description: "Vikram's brother-in-law owns the logistics firm that was awarded the pan-India freight contract last month. No disclosure was made in the vendor onboarding file.",
      status: "RESOLVED", incidentDaysAgo: 75,
    },
  ]

  let seq = 0

  for (const s of seeds) {
    seq++
    const submittedAt = new Date(now.getTime() - s.daysAgo * 24 * 60 * 60 * 1000)
    const token = generateReportToken()
    const sig = dupSignature(org.id, s.department, s.accusedName, s.category)

    const report = await db.report.create({
      data: {
        orgId: org.id,
        reportToken: token,
        channel: s.channel,
        category: s.category,
        severity: s.severity,
        department: s.department,
        accusedName: s.accusedName,
        accusedRole: s.accusedRole,
        encDescription: encrypt(s.description, encKey),
        encLocation: s.location ? encrypt(s.location, encKey) : null,
        incidentDate: new Date(now.getTime() - s.incidentDaysAgo * 24 * 60 * 60 * 1000),
        encContact: encrypt("anonymous-whistleblower@protonmail.com", encKey),
        anonymous: true,
        consentFollowup: true,
        status: s.status,
        dupSignature: sig,
        submittedAt,
      },
    })

    const caseRec = await db.case.create({
      data: {
        orgId: org.id,
        caseNumber: formatCaseNumber(seq, year),
        reportId: report.id,
        status: s.status,
        priority: s.severity === "CRITICAL" ? "HIGH" : s.severity,
        assignedTo: s.status === "SUBMITTED" ? null : officer.id,
        resolution:
          s.status === "RESOLVED"
            ? "Conflict of interest substantiated. Vendor contract re-tendered; mandatory disclosure policy rolled out org-wide. Disciplinary action initiated per POSH/COC policy."
            : null,
        resolvedAt: s.status === "RESOLVED" ? new Date(submittedAt.getTime() + 5 * 86400000) : null,
        createdAt: submittedAt,
        updatedAt: new Date(submittedAt.getTime() + (s.status === "SUBMITTED" ? 0 : 2 * 86400000)),
      },
    })

    // Audit: report submitted
    await appendAudit({
      orgId: org.id, reportId: report.id, caseId: caseRec.id,
      actorType: "WHISTLEBLOWER",
      action: s.channel === "WHATSAPP" ? "WHATSAPP_REPORT" : "REPORT_SUBMITTED",
      payload: JSON.stringify({ reportToken: token, channel: s.channel, category: s.category }),
      timestamp: submittedAt,
    })

    // Audit: case created
    await appendAudit({
      orgId: org.id, reportId: report.id, caseId: caseRec.id,
      actorType: "SYSTEM", action: "CASE_CREATED",
      payload: JSON.stringify({ caseNumber: caseRec.caseNumber }),
      timestamp: new Date(submittedAt.getTime() + 60_000),
    })

    if (s.status !== "SUBMITTED") {
      await appendAudit({
        orgId: org.id, caseId: caseRec.id,
        actorType: "OFFICER", actorEmail: officer.email,
        action: "STATUS_CHANGED",
        payload: JSON.stringify({ from: "SUBMITTED", to: "REVIEWING", by: officer.email }),
        timestamp: new Date(submittedAt.getTime() + 120_000),
      })

      // case assigned
      await appendAudit({
        orgId: org.id, caseId: caseRec.id,
        actorType: "OFFICER", actorEmail: admin.email,
        action: "CASE_ASSIGNED",
        payload: JSON.stringify({ assignee: officer.email }),
        timestamp: new Date(submittedAt.getTime() + 180_000),
      })
    }

    if (s.status === "RESOLVED") {
      await appendAudit({
        orgId: org.id, caseId: caseRec.id,
        actorType: "OFFICER", actorEmail: officer.email,
        action: "CASE_RESOLVED",
        payload: JSON.stringify({ resolution: "Substantiated; remediation complete." }),
        timestamp: new Date(submittedAt.getTime() + 5 * 86400000),
      })
    }
  }

  // A WhatsApp session trail (anonymous, hashed phone)
  await db.whatsappSession.create({
    data: {
      orgId: org.id,
      phoneHash: hashPhone("+919876543210"),
      sessionToken: generateReportToken(),
      step: "COMPLETED",
      draft: "{}",
    },
  })

  console.log(`  ✓ ${seeds.length} reports + cases + audit chain seeded`)
  console.log("✅ Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
