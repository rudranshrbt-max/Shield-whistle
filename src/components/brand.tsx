"use client"

import { cn } from "@/lib/utils"

export function Brand({
  className,
  variant = "dark",
  showText = true,
}: {
  className?: string
  variant?: "dark" | "light"
  showText?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm",
            variant === "dark"
              ? "bg-emerald-500/15 ring-1 ring-emerald-400/30"
              : "bg-white ring-1 ring-zinc-200",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ShieldWhistle" className="h-full w-full object-cover" />
        </div>
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
      </div>
      {showText && (
        <div className="leading-none">
          <div
            className={cn(
              "text-[15px] font-semibold tracking-tight",
              variant === "dark" ? "text-white" : "text-foreground",
            )}
          >
            ShieldWhistle
          </div>
          <div
            className={cn(
              "text-[10px] font-medium uppercase tracking-[0.14em]",
              variant === "dark" ? "text-emerald-300/80" : "text-emerald-600",
            )}
          >
            Secure Reporting
          </div>
        </div>
      )}
    </div>
  )
}
