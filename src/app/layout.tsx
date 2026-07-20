import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShieldWhistle — SEBI & Companies Act compliant whistleblower system",
  description:
    "Anonymous whistleblower + compliance reporting for Indian SMBs. Web + WhatsApp reporting, case management, tamper-proof audit log. Live in 48 hours.",
  keywords: [
    "whistleblower",
    "compliance",
    "SEBI",
    "Companies Act",
    "POSH",
    "India",
    "anonymous reporting",
    "case management",
  ],
  authors: [{ name: "ShieldWhistle" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ShieldWhistle",
    description:
      "SEBI and Companies Act compliant whistleblower system, live in 48 hours.",
    siteName: "ShieldWhistle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldWhistle",
    description:
      "SEBI and Companies Act compliant whistleblower system, live in 48 hours.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
