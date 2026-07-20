// ShieldWhistle — domain constants & type-safe enums.
// The DB stores these as String; here we centralise the canonical values
// so the whole app agrees on the vocabulary.

export const REPORT_CHANNELS = ["WEB", "WHATSAPP"] as const
export type ReportChannel = (typeof REPORT_CHANNELS)[number]

export const REPORT_CATEGORIES = [
  "FRAUD",
  "HARASSMENT",
  "DISCRIMINATION",
  "BRIBERY",
  "FINANCIAL_MISSTATEMENT",
  "DATA_PRIVACY",
  "WORKPLACE_SAFETY",
  "CONFLICT_OF_INTEREST",
  "OTHER",
] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const REPORT_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number]

export const CASE_STATUSES = ["SUBMITTED", "REVIEWING", "RESOLVED"] as const
export type CaseStatus = (typeof CASE_STATUSES)[number]

export const USER_ROLES = ["ADMIN", "OFFICER"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const PLANS = [
  {
    id: "PILOT",
    name: "Pilot",
    price: 0,
    maxEmployees: 500,
    tagline: "60-day free pilot, no card required",
    cta: "Start free pilot",
    highlight: false,
    features: [
      "Up to 500 employees",
      "Anonymous web + WhatsApp reporting",
      "Case management dashboard",
      "Tamper-proof audit log",
      "Duplicate pattern detection",
      "Multi-org isolation",
      "Email support",
    ],
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: 199,
    maxEmployees: 500,
    tagline: "For listed & regulated companies up to 500 employees",
    cta: "Start with Growth",
    highlight: true,
    features: [
      "Everything in Pilot, plus:",
      "Up to 500 employees",
      "Global compliance pack (SOX, GDPR, EU Whistleblowing Directive)",
      "Status workflow SLA tracking",
      "Priority WhatsApp onboarding",
      "Dedicated compliance concierge",
    ],
  },
  {
    id: "SCALE",
    name: "Scale",
    price: 349,
    maxEmployees: 1000,
    tagline: "For mid-market orgs up to 1,000 employees",
    cta: "Talk to sales",
    highlight: false,
    features: [
      "Everything in Growth, plus:",
      "Up to 1,000 employees",
      "Custom audit retention policy",
      "Officer training & onboarding",
      "Quarterly compliance review",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 599,
    maxEmployees: 2000,
    tagline: "For large orgs up to 2,000 employees",
    cta: "Talk to sales",
    highlight: false,
    features: [
      "Everything in Scale, plus:",
      "Up to 2,000 employees",
      "Multi-entity rollup",
      "Custom data residency",
      "Dedicated CSM + SLA",
    ],
  },
] as const

export const CATEGORY_LABELS: Record<string, string> = {
  FRAUD: "Financial Fraud",
  HARASSMENT: "Harassment / Misconduct",
  DISCRIMINATION: "Discrimination",
  BRIBERY: "Bribery / Corruption",
  FINANCIAL_MISSTATEMENT: "Financial Misstatement",
  DATA_PRIVACY: "Data Privacy Breach",
  WORKPLACE_SAFETY: "Workplace Safety",
  CONFLICT_OF_INTEREST: "Conflict of Interest",
  OTHER: "Other",
}

export const SEVERITY_META: Record<
  string,
  { label: string; color: string; ring: string; dot: string }
> = {
  LOW: { label: "Low", color: "bg-emerald-100 text-emerald-700 border-emerald-200", ring: "ring-emerald-500/20", dot: "bg-emerald-500" },
  MEDIUM: { label: "Medium", color: "bg-amber-100 text-amber-700 border-amber-200", ring: "ring-amber-500/20", dot: "bg-amber-500" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700 border-orange-200", ring: "ring-orange-500/20", dot: "bg-orange-500" },
  CRITICAL: { label: "Critical", color: "bg-red-100 text-red-700 border-red-200", ring: "ring-red-500/20", dot: "bg-red-500" },
}

export const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  SUBMITTED: { label: "Submitted", color: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  REVIEWING: { label: "Reviewing", color: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
}

export const AUDIT_ACTIONS: Record<string, string> = {
  REPORT_SUBMITTED: "Report submitted",
  CASE_CREATED: "Case created",
  STATUS_CHANGED: "Status changed",
  PRIORITY_CHANGED: "Priority changed",
  CASE_ASSIGNED: "Case assigned",
  CASE_REASSIGNED: "Case reassigned",
  MESSAGE_ADDED: "Note added",
  CASE_RESOLVED: "Case resolved",
  CASE_REOPENED: "Case reopened",
  REPORT_VIEWED: "Report decrypted & viewed",
  WHATSAPP_REPORT: "Report received via WhatsApp",
  ORG_CREATED: "Organization provisioned",
  INTEGRATION_CONNECTED: "WhatsApp integration connected",
}
