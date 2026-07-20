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
  title: "ShieldWhistle — Global whistleblower & compliance reporting",
  description:
    "Anonymous whistleblower + compliance reporting for companies worldwide. Web + WhatsApp reporting, case management, tamper-proof audit log. Live in 48 hours.",
  keywords: [
    "whistleblower",
    "compliance",
    "SOX",
    "GDPR",
    "EU Whistleblowing Directive",
    "anonymous reporting",
    "case management",
    "global",
  ],
  authors: [{ name: "ShieldWhistle" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "ShieldWhistle",
    description:
      "Globally compliant whistleblower system, live in 48 hours.",
    siteName: "ShieldWhistle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShieldWhistle",
    description:
      "Globally compliant whistleblower system, live in 48 hours.",
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
