"use client"

// Client-side API helper. Officer/dashboard requests attach the active org
// slug via the x-sw-org header so the server can enforce org isolation.

export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit & { orgSlug?: string | null } = {},
): Promise<T> {
  const { orgSlug, headers, ...rest } = opts
  const res = await fetch(path, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(orgSlug ? { "x-sw-org": orgSlug } : {}),
      ...(headers as Record<string, string>),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.error || `Request failed (${res.status})`)
  }
  return data as T
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n)
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 30) return `${days}d ago`
  const mo = Math.floor(days / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

export function formatDate(d: Date | string | null): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(d: Date | string | null): string {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function shortHash(h: string, len = 10): string {
  if (!h) return "—"
  return h.length > len ? `${h.slice(0, len)}…` : h
}
