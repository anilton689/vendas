import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Follow-up Crystal - Sistema de Orçamentos",
  description: "Sistema completo para gerenciamento e follow-up de orçamentos com integração ao Google Sheets",
  keywords: ["orçamentos", "follow-up", "vendas", "crm", "google sheets"],
  authors: [{ name: "Crystal Systems" }],
  creator: "Crystal Systems",
  publisher: "Crystal Systems",
  robots: "index, follow",
  openGraph: {
    title: "Follow-up Crystal - Sistema de Orçamentos",
    description: "Sistema completo para gerenciamento e follow-up de orçamentos",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Follow-up Crystal - Sistema de Orçamentos",
    description: "Sistema completo para gerenciamento e follow-up de orçamentos",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Follow-up Crystal" />
        <meta name="apple-mobile-web-app-title" content="Follow-up Crystal" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
