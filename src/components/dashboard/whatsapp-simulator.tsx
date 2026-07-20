"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Send, ShieldCheck, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Msg {
  id: string
  role: "bot" | "user" | "system"
  content: string
  ts: number
}

export function WhatsappSimulator({ orgSlug }: { orgSlug: string }) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [step, setStep] = useState<string>("IDLE")
  const [completed, setCompleted] = useState<{ reportToken: string; caseNumber: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 8000,
    })
    socketRef.current = s

    s.on("connect", () => setConnected(true))
    s.on("disconnect", () => setConnected(false))
    s.on("message", (m: Msg) => setMessages((prev) => [...prev, m]))
    s.on("history", (msgs: Msg[]) => setMessages(msgs))
    s.on("step", (st: string) => setStep(st))
    s.on("completed", (data: { reportToken: string; caseNumber: string }) => setCompleted(data))
    s.on("error", (e: any) => console.error("[wa-sim]", e))

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const start = () => {
    setMessages([])
    setCompleted(null)
    setStep("GREET")
    socketRef.current?.emit("start", { orgSlug })
  }

  const send = () => {
    if (!input.trim() || !socketRef.current) return
    socketRef.current.emit("text", { content: input.trim() })
    setInput("")
  }

  const isDone = step === "DONE" || completed !== null

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
      {/* WhatsApp-style header */}
      <div className="flex items-center justify-between bg-[#202c33] px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">ShieldWhistle Bot</div>
            <div className="flex items-center gap-1 text-[10px] text-green-400">
              <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-green-400" : "bg-zinc-500")} />
              {connected ? "online · end-to-end encrypted" : "connecting…"}
            </div>
          </div>
        </div>
        <Badge variant="outline" className="border-zinc-600 bg-zinc-800 text-[10px] text-zinc-300">
          +91 98••• ••210
        </Badge>
      </div>

      {/* Chat body */}
      <div
        ref={scrollRef}
        className="sw-scroll h-[420px] space-y-2 overflow-y-auto bg-[#0b141a] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_60%)] p-3"
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/20">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="mt-3 max-w-xs text-sm text-zinc-400">
              Start a live conversation with the WhatsApp bot. It walks a whistleblower through filing a complete report over chat.
            </p>
            <Button onClick={start} disabled={!connected} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              Start conversation
            </Button>
            {!connected && (
              <p className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Connecting to bot service…
              </p>
            )}
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex sw-fade-up",
              m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start",
            )}
          >
            {m.role === "system" ? (
              <span className="rounded-full bg-zinc-800/60 px-3 py-1 text-[10px] text-zinc-400">{m.content}</span>
            ) : (
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-line rounded-lg px-3 py-2 text-xs leading-relaxed shadow",
                  m.role === "user"
                    ? "rounded-br-sm bg-[#005c4b] text-white"
                    : "rounded-bl-sm bg-[#202c33] text-zinc-100",
                )}
              >
                {m.content}
                <div className={cn("mt-1 text-[9px]", m.role === "user" ? "text-emerald-200/70" : "text-zinc-500")}>
                  {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            )}
          </div>
        ))}
        {completed && (
          <div className="flex justify-center pt-1">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-medium text-emerald-300">
              ✓ Filed · {completed.caseNumber} · {completed.reportToken}
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-zinc-800 bg-[#202c33] px-3 py-2.5">
        {isDone ? (
          <Button onClick={start} variant="outline" className="flex-1 border-zinc-600 bg-transparent text-white hover:bg-zinc-800 hover:text-white">
            <RotateCcw className="mr-1.5 h-4 w-4" /> Start a new report
          </Button>
        ) : (
          <>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={messages.length === 0 ? "Click 'Start conversation' first…" : "Type your reply…"}
              disabled={messages.length === 0 || !connected}
              className="flex-1 border-zinc-700 bg-[#2a3942] text-white placeholder:text-zinc-500 focus-visible:ring-emerald-500"
            />
            <Button
              onClick={send}
              disabled={!input.trim() || !connected || messages.length === 0}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
