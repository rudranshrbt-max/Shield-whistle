"use client"

import { create } from "zustand"

export type View = "landing" | "report" | "track" | "dashboard"
export type DashboardTab =
  | "overview"
  | "inbox"
  | "audit"
  | "duplicates"
  | "whatsapp"
  | "settings"

interface OrgSummary {
  id: string
  name: string
  slug: string
  industry: string
  employeeCount: number
  plan: string
  monthlyFee: number
}

interface AppState {
  view: View
  activeOrgSlug: string | null
  dashboardTab: DashboardTab
  orgs: OrgSummary[]
  orgsLoaded: boolean
  setView: (v: View) => void
  setDashboardTab: (t: DashboardTab) => void
  setActiveOrgSlug: (s: string | null) => void
  setOrgs: (o: OrgSummary[]) => void
  gotoDashboard: (slug: string) => void
}

export const useApp = create<AppState>((set) => ({
  view: "landing",
  activeOrgSlug: null,
  dashboardTab: "overview",
  orgs: [],
  orgsLoaded: false,
  setView: (v) => set({ view: v }),
  setDashboardTab: (t) => set({ dashboardTab: t }),
  setActiveOrgSlug: (s) => set({ activeOrgSlug: s }),
  setOrgs: (o) => set({ orgs: o, orgsLoaded: true }),
  gotoDashboard: (slug) =>
    set({ activeOrgSlug: slug, view: "dashboard", dashboardTab: "overview" }),
}))
