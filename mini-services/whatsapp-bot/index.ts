// ShieldWhistle — WhatsApp bot mini-service.
// Simulates a WhatsApp Business API (Twilio) conversation that lets a
// whistleblower file a report entirely over chat — the core differentiator.
//
// The frontend connects via socket.io (`io("/?XTransformPort=3003")`),
// the bot walks the user through a guided state machine, and on completion
// POSTs the collected (still-anonymous) payload to the main app's
// /api/reports endpoint with channel=WHATSAPP.
//
// Port: 3003 (fixed). Started in the background alongside the Next.js app.

import { createServer } from "http"
import { Server } from "socket.io"

const PORT = 3003
const APP_BASE = "http://localhost:3000"

const httpServer = createServer()
const io = new Server(httpServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

type Role = "bot" | "user" | "system"
interface ChatMessage {
  id: string
  role: Role
  content: string
  ts: number
}

type Step =
  | "GREET"
  | "CATEGORY"
  | "SEVERITY"
  | "DEPARTMENT"
  | "ACCUSED_NAME"
  | "ACCUSED_ROLE"
  | "DESCRIPTION"
  | "LOCATION"
  | "INCIDENT_DATE"
  | "CONSENT"
  | "CONTACT"
  | "SUBMITTING"
  | "DONE"

interface Draft {
  orgSlug: string
  category?: string
  severity?: string
  department?: string
  accusedName?: string
  accusedRole?: string
  description?: string
  location?: string
  incidentDate?: string
  contact?: string
  consentFollowup?: boolean
}

interface Session {
  socketId: string
  step: Step
  draft: Draft
  messages: ChatMessage[]
}

const sessions = new Map<string, Session>()

const CATEGORIES: Record<string, { value: string; label: string }> = {
  "1": { value: "FRAUD", label: "Financial Fraud" },
  "2": { value: "HARASSMENT", label: "Harassment / Misconduct" },
  "3": { value: "BRIBERY", label: "Bribery / Corruption" },
  "4": { value: "DISCRIMINATION", label: "Discrimination" },
  "5": { value: "WORKPLACE_SAFETY", label: "Workplace Safety" },
  "6": { value: "DATA_PRIVACY", label: "Data Privacy Breach" },
  "7": { value: "FINANCIAL_MISSTATEMENT", label: "Financial Misstatement" },
  "8": { value: "OTHER", label: "Other" },
}
const SEVERITIES: Record<string, { value: string; label: string }> = {
  "1": { value: "LOW", label: "Low" },
  "2": { value: "MEDIUM", label: "Medium" },
  "3": { value: "HIGH", label: "High" },
  "4": { value: "CRITICAL", label: "Critical" },
}

const id = () => Math.random().toString(36).slice(2, 10)

function pushMsg(session: Session, role: Role, content: string) {
  const msg: ChatMessage = { id: id(), role, content, ts: Date.now() }
  session.messages.push(msg)
  return msg
}

function botSay(session: Session, content: string, delay = 450) {
  // simulate typing delay for realism
  setTimeout(() => {
    const msg = pushMsg(session, "bot", content)
    io.to(session.socketId).emit("message", msg)
  }, delay)
}

function startConversation(socketId: string, orgSlug: string) {
  const session: Session = { socketId, step: "GREET", draft: { orgSlug }, messages: [] }
  sessions.set(socketId, session)
  pushMsg(session, "system", `Connected to ${orgSlug} secure line`)
  botSay(
    session,
    "👋 Welcome to ShieldWhistle Secure Reporting. This channel is end-to-end encrypted. Your phone number is NEVER stored — only a one-way hash. Reply STOP any time to cancel.",
    200,
  )
  botSay(
    session,
    "First, what are you reporting? Reply with a number:\n1️⃣ Financial Fraud\n2️⃣ Harassment / Misconduct\n3️⃣ Bribery / Corruption\n4️⃣ Discrimination\n5️⃣ Workplace Safety\n6️⃣ Data Privacy Breach\n7️⃣ Financial Misstatement\n8️⃣ Other",
    1100,
  )
  session.step = "CATEGORY"
  io.to(socketId).emit("history", session.messages)
  io.to(socketId).emit("step", session.step)
}

async function submitReport(session: Session) {
  session.step = "SUBMITTING"
  io.to(session.socketId).emit("step", session.step)
  const submitting = pushMsg(session, "bot", "🔒 Encrypting and submitting your report…")
  io.to(session.socketId).emit("message", submitting)

  try {
    const res = await fetch(`${APP_BASE}/api/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...session.draft, channel: "WHATSAPP" }),
    })
    const data = await res.json()
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Submission failed")
    }
    const done = pushMsg(
      session,
      `✅ Report received securely.\n\n📋 Case: ${data.caseNumber}\n🔑 Tracking token: ${data.reportToken}\n\nSave this token privately. Use it at our portal to check status anonymously. An officer will review within 1 business day.\n\nThank you for speaking up. 🙏`,
    )
    io.to(session.socketId).emit("message", done)
    session.step = "DONE"
    io.to(session.socketId).emit("step", session.step)
    io.to(session.socketId).emit("completed", {
      reportToken: data.reportToken,
      caseNumber: data.caseNumber,
    })
  } catch (e: any) {
    const err = pushMsg(
      session,
      `⚠️ Something went wrong submitting your report: ${e.message}. Please try again later or use the web form. Your chat is not saved.`,
    )
    io.to(session.socketId).emit("message", err)
    session.step = "DONE"
    io.to(session.socketId).emit("step", session.step)
  }
}

function handleUserText(session: Session, text: string) {
  const userMsg = pushMsg(session, "user", text)
  io.to(session.socketId).emit("message", userMsg)
  const t = text.trim()
  if (t.toUpperCase() === "STOP") {
    botSay(session, "🚫 Conversation cancelled. Nothing was saved. Stay safe. 🙏")
    session.step = "DONE"
    io.to(session.socketId).emit("step", session.step)
    return
  }
  if (t.toUpperCase() === "SKIP") {
    // allow skipping optional fields
  }

  switch (session.step) {
    case "CATEGORY": {
      const c = CATEGORIES[t]
      if (!c) {
        botSay(session, "Please reply with a number from 1 to 8.")
        return
      }
      session.draft.category = c.value
      botSay(session, `Got it — ${c.label}. How severe is this?\n1️⃣ Low\n2️⃣ Medium\n3️⃣ High\n4️⃣ Critical`)
      session.step = "SEVERITY"
      break
    }
    case "SEVERITY": {
      const s = SEVERITIES[t]
      if (!s) {
        botSay(session, "Please reply with a number from 1 to 4.")
        return
      }
      session.draft.severity = s.value
      botSay(session, `${s.label} severity noted. Which department is this about? (e.g. Sales, Finance, Operations, Procurement)`)
      session.step = "DEPARTMENT"
      break
    }
    case "DEPARTMENT": {
      session.draft.department = t
      botSay(session, "Name of the person you're reporting? (first + last name)")
      session.step = "ACCUSED_NAME"
      break
    }
    case "ACCUSED_NAME": {
      if (t.length < 2) {
        botSay(session, "Please enter a name (at least 2 characters), or reply STOP to cancel.")
        return
      }
      session.draft.accusedName = t
      botSay(session, "Their role or title? (e.g. Regional Sales Manager) — reply SKIP if you don't know.")
      session.step = "ACCUSED_ROLE"
      break
    }
    case "ACCUSED_ROLE": {
      session.draft.accusedRole = t.toUpperCase() === "SKIP" ? "Unknown" : t
      botSay(
        session,
        "Describe what happened in your own words (minimum 20 characters). Specifics like dates, amounts, and witnesses help the investigation.",
      )
      session.step = "DESCRIPTION"
      break
    }
    case "DESCRIPTION": {
      if (t.length < 20) {
        botSay(session, `That's only ${t.length} characters. Please add a bit more detail (minimum 20).`)
        return
      }
      session.draft.description = t
      botSay(session, "Where did it happen? (office / plant / city) — reply SKIP if not applicable.")
      session.step = "LOCATION"
      break
    }
    case "LOCATION": {
      session.draft.location = t.toUpperCase() === "SKIP" ? "" : t
      botSay(session, "When did it happen? Reply a date like 2025-06-15, or SKIP.")
      session.step = "INCIDENT_DATE"
      break
    }
    case "INCIDENT_DATE": {
      if (t.toUpperCase() !== "SKIP") {
        const d = new Date(t)
        if (!isNaN(d.getTime())) session.draft.incidentDate = d.toISOString()
      }
      botSay(
        session,
        "Would you like officers to follow up with you privately? Your contact stays encrypted and separate from your report.\n1️⃣ Yes — share my email/phone\n2️⃣ No — stay fully anonymous",
      )
      session.step = "CONSENT"
      break
    }
    case "CONSENT": {
      if (t === "1") {
        session.draft.consentFollowup = true
        botSay(session, "Share your email or phone for follow-up. This is encrypted end-to-end and never linked to this chat.")
        session.step = "CONTACT"
      } else {
        session.draft.consentFollowup = false
        botSay(session, "Staying anonymous. Here's a summary before I submit:", 300)
        botSay(session, summary(session.draft), 900)
        botSay(session, "Reply SUBMIT to file, or STOP to cancel.", 1400)
        session.step = "SUBMITTING"
      }
      break
    }
    case "CONTACT": {
      session.draft.contact = t
      botSay(session, "Thanks. Here's a summary before I submit:", 300)
      botSay(session, summary(session.draft), 900)
      botSay(session, "Reply SUBMIT to file, or STOP to cancel.", 1400)
      session.step = "SUBMITTING"
      break
    }
    case "SUBMITTING": {
      if (t.toUpperCase() === "SUBMIT") {
        submitReport(session)
      } else {
        botSay(session, 'Reply SUBMIT to file this report, or STOP to cancel.')
      }
      break
    }
    case "DONE": {
      botSay(session, "This session is complete. Start a new report from the portal if needed. 🙏")
      break
    }
    default:
      break
  }
  io.to(session.socketId).emit("step", session.step)
}

function summary(d: Draft): string {
  const lines = [
    `• Category: ${d.category}`,
    `• Severity: ${d.severity}`,
    `• Department: ${d.department}`,
    `• Accused: ${d.accusedName} (${d.accusedRole})`,
    `• Description: ${d.description?.slice(0, 80)}${(d.description?.length ?? 0) > 80 ? "…" : ""}`,
  ]
  if (d.location) lines.push(`• Location: ${d.location}`)
  if (d.incidentDate) lines.push(`• Incident: ${d.incidentDate.slice(0, 10)}`)
  lines.push(`• Follow-up: ${d.consentFollowup ? "Yes" : "No (anonymous)"}`)
  return lines.join("\n")
}

io.on("connection", (socket) => {
  console.log(`[whatsapp-bot] client connected: ${socket.id}`)

  socket.on("start", (data: { orgSlug: string }) => {
    if (!data?.orgSlug) {
      socket.emit("error", { message: "orgSlug required" })
      return
    }
    startConversation(socket.id, data.orgSlug)
  })

  socket.on("text", (data: { content: string }) => {
    const session = sessions.get(socket.id)
    if (!session) {
      socket.emit("error", { message: "No active session. Emit 'start' first." })
      return
    }
    handleUserText(session, data.content)
  })

  socket.on("disconnect", () => {
    sessions.delete(socket.id)
    console.log(`[whatsapp-bot] client disconnected: ${socket.id}`)
  })

  socket.on("error", (err) => {
    console.error(`[whatsapp-bot] socket error (${socket.id}):`, err)
  })
})

httpServer.listen(PORT, () => {
  console.log(`🟢 ShieldWhistle WhatsApp bot running on port ${PORT}`)
})

process.on("SIGTERM", () => {
  httpServer.close(() => process.exit(0))
})
process.on("SIGINT", () => {
  httpServer.close(() => process.exit(0))
})
