"use client"

import { useEffect, useState } from "react"
import { Menu, X, MessageSquare, LayoutDashboard, FileText, Search, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Brand } from "@/components/brand"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

const NAV = [
  { id: "landing", label: "Overview", icon: ShieldCheck },
  { id: "report", label: "Report", icon: FileText },
  { id: "track", label: "Track", icon: Search },
  { id: "dashboard", label: "Officer Dashboard", icon: LayoutDashboard },
] as const

export function SiteHeader() {
  const { view, setView } = useApp()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-zinc-200/80 bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => setView("landing")} className="flex items-center" aria-label="ShieldWhistle home">
          <Brand variant="light" />
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                view === n.id
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView("report")}
            className="text-zinc-600"
          >
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Submit report
          </Button>
          <Button size="sm" onClick={() => setView("dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
            <LayoutDashboard className="mr-1.5 h-4 w-4" />
            Officer login
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                setView(n.id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                view === n.id ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </button>
          ))}
          <Button
            className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setView("report")
              setOpen(false)
            }}
          >
            Submit a report
          </Button>
        </div>
      )}
    </header>
  )
}
