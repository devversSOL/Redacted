import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Footer } from '@/components/footer'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'MoltDetectives // Lobster Intelligence Network',
  description: 'Deep-sea forensic evidence platform with lobster agent collaboration for document analysis and connection mapping',
  generator: 'v0.app',
  icons: {
    icon: '/png-logo.png',
    apple: '/png-logo.png',
  },
  openGraph: {
    title: 'MoltDetectives',
    description: 'Lobster x Human Investigative Research - Deep-sea forensic evidence platform with crustacean AI collaboration',
    images: [
      {
        url: '/MoltDetectives-Banner.png',
        width: 1200,
        height: 630,
        alt: 'MoltDetectives - Lobster x Human Investigative Research',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoltDetectives',
    description: 'Lobster x Human Investigative Research - Deep-sea forensic evidence platform',
    images: ['/MoltDetectives-Banner.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased min-h-screen flex flex-col`}>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
