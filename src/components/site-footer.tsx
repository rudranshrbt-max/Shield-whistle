"use client"

import { ShieldCheck, Lock, FileCheck2, Scale } from "lucide-react"
import { Brand } from "@/components/brand"
import { useApp } from "@/lib/store"

export function SiteFooter() {
  const setView = useApp((s) => s.setView)
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-950 text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Brand variant="dark" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
              A globally compliant whistleblower system for companies of any
              size, anywhere. Anonymous web + WhatsApp reporting, case
              management, and a tamper-proof audit log — live in 48 hours.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: Lock, label: "E2E Encrypted" },
                { icon: ShieldCheck, label: "100% Anonymous" },
                { icon: FileCheck2, label: "Audit-ready" },
                { icon: Scale, label: "SOX & GDPR ready" },
              ].map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300"
                >
                  <b.icon className="h-3.5 w-3.5 text-emerald-400" />
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { l: "Submit a report", v: "report" as const },
                { l: "Track a report", v: "track" as const },
                { l: "Officer dashboard", v: "dashboard" as const },
                { l: "Pricing", v: "landing" as const },
              ].map((i) => (
                <li key={i.l}>
                  <button
                    onClick={() => setView(i.v)}
                    className="text-zinc-400 transition-colors hover:text-emerald-400"
                  >
                    {i.l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">Compliance</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>SOX §301/806 (US)</li>
              <li>EU Whistleblowing Directive</li>
              <li>GDPR (EU)</li>
              <li>Local labor & harassment law</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} ShieldWhistle. Built for compliant enterprises worldwide.</p>
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 sw-pulse" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  )
}
