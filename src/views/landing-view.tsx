"use client"

import { useEffect, useState } from "react"
import {
  ShieldCheck,
  Lock,
  MessageSquare,
  LayoutDashboard,
  Copy,
  GitBranch,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Fingerprint,
  Clock,
  Scale,
  FileCheck2,
  Users,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/store"
import { PLANS } from "@/lib/constants"
import { formatUSD, apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

const STATS = [
  { value: "48 hrs", label: "To go live", icon: Clock },
  { value: "100%", label: "Anonymous", icon: Fingerprint },
  { value: "E2E", label: "Encrypted", icon: Lock },
  { value: "$0", label: "60-day pilot", icon: ShieldCheck },
]

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Anonymous reporting",
    desc: "Web form + WhatsApp bot. Whistleblowers never log in, never share a number, never leave a trace. They get a private token to track status.",
    accent: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp submission bot",
    desc: "Your differentiator. Most employees will never open a web portal — but they already trust WhatsApp. Guided chat files a complete report in minutes.",
    accent: "bg-green-50 text-green-600 ring-green-100",
    badge: "Differentiator",
  },
  {
    icon: LayoutDashboard,
    title: "Case management dashboard",
    desc: "A clean inbox for HR & compliance officers. Triage by severity, assign owners, move Submitted → Reviewing → Resolved, add encrypted internal notes.",
    accent: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    icon: Copy,
    title: "Duplicate pattern detection",
    desc: "When the same person in the same department is reported again, we surface the pattern instantly — the single most valuable signal for an officer.",
    accent: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: GitBranch,
    title: "Tamper-proof audit log",
    desc: "Every action is hash-chained. Hand a regulator a verifiable trail proving your vigil mechanism actually works — no spreadsheet can survive tampering.",
    accent: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  {
    icon: Building2,
    title: "Multi-org isolation",
    desc: "Each company's data lives in its own walled garden with its own encryption key. One breach never becomes two. Built for holding companies & groups.",
    accent: "bg-sky-50 text-sky-600 ring-sky-100",
  },
]

const STEPS = [
  {
    n: "01",
    title: "Whistleblower reports",
    desc: "Via the anonymous web form or the WhatsApp bot. No login, no name required. Content is encrypted before it leaves the browser.",
  },
  {
    n: "02",
    title: "Officer triages",
    desc: "The case lands in the dashboard inbox. Triage by severity, assign an owner, move through the status workflow, add encrypted notes.",
  },
  {
    n: "03",
    title: "Audit trail proves compliance",
    desc: "Every action is hash-chained. Export a tamper-evident log for SOX, GDPR, or your audit committee. Done.",
  },
]

const WHATSAPP_SCRIPT = [
  { role: "bot", text: "👋 Welcome to ShieldWhistle Secure Reporting. Your number is never stored." },
  { role: "bot", text: "What are you reporting? Reply a number:\n1️⃣ Harassment\n2️⃣ Bribery\n3️⃣ Fraud…" },
  { role: "user", text: "1" },
  { role: "bot", text: "Harassment / Misconduct. How severe?\n1️⃣ Low  2️⃣ Medium  3️⃣ High  4️⃣ Critical" },
  { role: "user", text: "3" },
  { role: "bot", text: "High severity noted. Which department?" },
  { role: "user", text: "Sales" },
  { role: "bot", text: "Name of the person you're reporting?" },
  { role: "user", text: "Anil Kapoor" },
  { role: "bot", text: "Describe what happened (min 20 chars)…" },
  { role: "user", text: "Repeated inappropriate comments in team huddles. Two colleagues quit." },
  { role: "bot", text: "🔒 Encrypting and submitting…\n✅ Report received. Case SW-2025-0007. Token: SW-7K2M-9QX4-LP3R" },
]

export function LandingView() {
  const { setView, gotoDashboard, orgs, setOrgs, orgsLoaded } = useApp()
  const [waOpen, setWaOpen] = useState(false)
  const [waStep, setWaStep] = useState(0)

  useEffect(() => {
    if (!orgsLoaded) {
      apiFetch("/api/orgs").then((d) => setOrgs(d.orgs)).catch(() => {})
    }
  }, [orgsLoaded, setOrgs])

  const openWhatsApp = () => {
    setWaStep(0)
    setWaOpen(true)
  }

  useEffect(() => {
    if (!waOpen) return
    const t = setInterval(() => {
      setWaStep((s) => {
        if (s >= WHATSAPP_SCRIPT.length - 1) {
          clearInterval(t)
          return s
        }
        return s + 1
      })
    }, 1100)
    return () => clearInterval(t)
  }, [waOpen])

  return (
    <div className="sw-fade-up">
      {/* HERO */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 vault-grid opacity-60" />
        <div className="absolute inset-0 vault-glow" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 sw-pulse" />
              60-day free pilot · No card required · Live in 48 hours
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
              The whistleblower system your{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                auditors
              </span>{" "}
              actually want.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-zinc-300">
              A globally compliant whistleblower + reporting platform for
              companies of any size, anywhere. Anonymous web &amp; WhatsApp
              submission, case management, duplicate detection, and a
              tamper-proof audit log.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setView("report")}
                className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 sm:w-auto"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Submit a report
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => gotoDashboard(orgs[0]?.slug ?? "acme")}
                className="w-full border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white sm:w-auto"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                See live dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Demo org pre-loaded with 8 cases · No signup to explore
            </p>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-zinc-950/80 p-5 text-center backdrop-blur">
                <s.icon className="mx-auto mb-2 h-5 w-5 text-emerald-400" />
                <div className="text-2xl font-semibold text-white">{s.value}</div>
                <div className="mt-0.5 text-xs text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-zinc-200 bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4 border-rose-200 bg-rose-50 text-rose-700">
                <AlertTriangle className="mr-1 h-3 w-3" /> The exposure
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                You're legally required to have this. Most companies don't.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-600">
                Regulations like SOX, the EU Whistleblowing Directive, and
                similar laws worldwide mandate a formal reporting mechanism.
                One audit finding — or one viral complaint — and you're exposed.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "A spreadsheets-and-inbox \"whistleblower line\" fails every audit.",
                  "An anonymous Gmail address is not a vigil mechanism.",
                  "If you can't prove the trail, the regulator assumes you don't have one.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-zinc-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <AlertTriangle className="h-3 w-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Card className="overflow-hidden border-zinc-200 shadow-lg">
              <CardContent className="p-0">
                <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <Scale className="h-4 w-4 text-emerald-600" />
                    What you must demonstrate
                  </div>
                </div>
                <ul className="divide-y divide-zinc-100">
                  {[
                    { law: "SOX §301/806 (US)", need: "Whistleblower mechanism for listed entities" },
                    { law: "EU Whistleblowing Directive", need: "Establish a secure reporting channel with safeguards" },
                    { law: "GDPR / global privacy laws", need: "Protect whistleblower personal data" },
                    { law: "Local labor & harassment law", need: "Confidential complaint handling" },
                  ].map((r) => (
                    <li key={r.law} className="flex items-start gap-3 px-5 py-3.5">
                      <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <div className="text-sm font-semibold text-zinc-900">{r.law}</div>
                        <div className="text-xs text-zinc-500">{r.need}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
              V1 features — nothing else
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Six things. Done properly.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              We deliberately ship a narrow V1. Everything below is production-grade today.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="group relative overflow-hidden border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl ring-1", f.accent)}>
                      <f.icon className="h-5 w-5" />
                    </div>
                    {f.badge && (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">{f.badge}</Badge>
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-zinc-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Three steps. Forty-eight hours.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              From signup to a regulator-ready vigil mechanism in less time than your next standup cycle.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-6">
                  <div className="flex items-center gap-3">
                    <span className="sw-mono text-sm font-semibold text-emerald-600">{s.n}</span>
                    <div className="h-px flex-1 bg-zinc-200" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-zinc-300 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHATSAPP SPOTLIGHT */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 text-white">
        <div className="absolute inset-0 vault-grid opacity-40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Badge variant="outline" className="mb-4 border-green-400/30 bg-green-500/10 text-green-300">
              <MessageSquare className="mr-1 h-3 w-3" /> The differentiator
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Your employees are on WhatsApp. So is your whistleblower line.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-zinc-300">
              A web portal gets 2 reports a year. A WhatsApp number the whole
              company already trusts gets 20. Our guided bot walks a
              whistleblower through category, severity, accused, and narrative —
              all over chat, fully encrypted, number never stored.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Guided state-machine conversation — no abandoned half-reports",
                "Phone number one-way hashed, never persisted in plaintext",
                "Auto-creates a case + audit entry identical to web reports",
                "Works on every phone, everywhere. Zero app install.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                  {t}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="mt-7 border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white"
              onClick={openWhatsApp}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Replay a sample conversation
            </Button>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2.5rem] border-4 border-zinc-800 bg-zinc-900 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[2rem] bg-[#0b141a]">
                <div className="flex items-center justify-between bg-[#202c33] px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">ShieldWhistle</div>
                      <div className="text-[10px] text-green-400">● online · encrypted</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-400">+1 555••• ••210</div>
                </div>
                <div className="sw-scroll h-[420px] space-y-2 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.06),transparent_60%)] p-3">
                  {WHATSAPP_SCRIPT.slice(0, waStep + 1).map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex sw-fade-up",
                        m.role === "user" ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 text-xs leading-relaxed shadow",
                          m.role === "user"
                            ? "rounded-br-sm bg-[#005c4b] text-white"
                            : "rounded-bl-sm bg-[#202c33] text-zinc-100",
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {waStep >= WHATSAPP_SCRIPT.length - 1 && (
                    <div className="flex justify-center pt-2">
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-300">
                        ✓ Report filed · case SW-2025-0007
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2">
                  <div className="flex-1 rounded-full bg-[#2a3942] px-3 py-2 text-[11px] text-zinc-500">
                    Type a message…
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
              <Users className="mr-1 h-3 w-3" /> Transparent pricing
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Priced for companies of every size, worldwide.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Start with a 60-day free pilot. Upgrade when your audit committee stops sweating.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <Card
                key={p.id}
                className={cn(
                  "relative flex flex-col border bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  p.highlight ? "border-emerald-300 ring-2 ring-emerald-200" : "border-zinc-200",
                )}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Most popular</Badge>
                  </div>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="text-sm font-semibold uppercase tracking-wide text-emerald-600">{p.name}</div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-zinc-900">
                      {p.price === 0 ? "Free" : formatUSD(p.price)}
                    </span>
                    {p.price > 0 && <span className="text-sm text-zinc-500">/mo</span>}
                  </div>
                  <p className="mt-1.5 text-xs text-zinc-500">{p.tagline}</p>
                  <Button
                    className="mt-5 w-full"
                    variant={p.highlight ? "default" : "outline"}
                    onClick={() => setView("dashboard")}
                  >
                    {p.cta}
                  </Button>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-zinc-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className={cn(f.endsWith(":") && "font-semibold text-zinc-900")}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-zinc-500">
            All plans include multi-org isolation, E2E encryption, and the tamper-proof audit log. GST extra. Annual billing gets 2 months free.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-8 py-14 text-center text-white sm:px-16">
            <div className="absolute inset-0 vault-grid opacity-50" />
            <div className="absolute inset-0 vault-glow" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Live in 48 hours. Auditor-ready in 49.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-zinc-300">
                Book a 20-minute call. We provision your org, generate your encryption key, and connect your WhatsApp number before you hang up.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => setView("report")}
                  className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 sm:w-auto"
                >
                  Start free pilot
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => gotoDashboard(orgs[0]?.slug ?? "acme")}
                  className="w-full border-zinc-700 bg-zinc-900/50 text-white hover:bg-zinc-800 hover:text-white sm:w-auto"
                >
                  Explore the dashboard
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {waOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setWaOpen(false)}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-[2rem] border-4 border-zinc-800 bg-zinc-900 p-2 shadow-2xl">
              <div className="overflow-hidden rounded-[1.6rem] bg-[#0b141a]">
                <div className="flex items-center justify-between bg-[#202c33] px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">ShieldWhistle</div>
                      <div className="text-[10px] text-green-400">● online · encrypted</div>
                    </div>
                  </div>
                  <button onClick={() => setWaOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
                </div>
                <div className="sw-scroll h-[460px] space-y-2 overflow-y-auto bg-[#0b141a] p-3">
                  {WHATSAPP_SCRIPT.slice(0, waStep + 1).map((m, i) => (
                    <div key={i} className={cn("flex sw-fade-up", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-xs leading-relaxed",
                          m.role === "user" ? "rounded-br-sm bg-[#005c4b] text-white" : "rounded-bl-sm bg-[#202c33] text-zinc-100",
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
