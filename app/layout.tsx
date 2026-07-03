import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '보물상자 — 게임 스토어 & 예약 플랫폼',
  description:
    '내 주변 게임 매장을 찾고, 실시간 재고를 확인하고, 방문 전에 게임을 예약하세요.',
  generator: 'v0.app',
  keywords: ['게임 매장', '게임 재고', '게임 예약', '주변 매장', 'PS5', '닌텐도 스위치', 'Xbox'],
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#121212',
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
    <html lang="ko" className="bg-background">
      <body className="font-sans antialiased bg-background">
        {children}
      </body>
    </html>
  )
}
