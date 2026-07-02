import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Treasure Box — Game Inventory Near You',
  description:
    'Discover nearby game stores, check real-time inventory, and reserve games before you visit.',
  generator: 'v0.app',
  keywords: ['game store', 'game inventory', 'reserve games', 'nearby stores', 'PS5', 'Nintendo Switch', 'Xbox'],
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-background">
        {children}
      </body>
    </html>
  )
}
