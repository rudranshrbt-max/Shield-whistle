"use client"

import { useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LandingView } from "@/views/landing-view"
import { ReportView } from "@/views/report-view"
import { TrackView } from "@/views/track-view"
import { DashboardView } from "@/views/dashboard-view"
import { useApp } from "@/lib/store"

export default function Home() {
  const view = useApp((s) => s.view)

  // Scroll to top whenever the view changes
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }, [view])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {view === "landing" && <LandingView />}
        {view === "report" && <ReportView />}
        {view === "track" && <TrackView />}
        {view === "dashboard" && <DashboardView />}
      </main>
      <SiteFooter />
    </div>
  )
}
