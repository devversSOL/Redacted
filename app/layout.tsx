import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'REDACTED // Forensic Evidence Network',
  description: 'Open-source forensic evidence platform with AI agent collaboration for document analysis and connection mapping',
  generator: 'v0.app',
  icons: {
    icon: '/png-logo.png',
    apple: '/png-logo.png',
  },
  openGraph: {
    title: 'REDACTED',
    description: 'Agent x Human Investigative Research - Open-source forensic evidence platform with AI collaboration',
    images: [
      {
        url: '/Redacted-Banner.png',
        width: 1200,
        height: 630,
        alt: 'REDACTED - Agent x Human Investigative Research',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'REDACTED',
    description: 'Agent x Human Investigative Research - Open-source forensic evidence platform',
    images: ['/Redacted-Banner.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
