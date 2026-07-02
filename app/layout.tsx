import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Treasure Box — Game Inventory Near You',
  description:
    'Discover nearby game stores, check real-time inventory, and reserve games before you visit.',
  generator: 'v0.app',
  keywords: ['game store', 'game inventory', 'reserve games', 'nearby stores', 'PS5', 'Nintendo Switch', 'Xbox'],
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0F172A',
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
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased bg-background">
        {children}
      </body>
    </html>
  )
}
