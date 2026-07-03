import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SettingsBootstrap } from '@/components/settings-bootstrap'

// FOUC 방지: 렌더 전에 localStorage에서 테마를 읽어 html 클래스를 적용
const FOUC_SCRIPT = `
(function(){
  try {
    var s = JSON.parse(localStorage.getItem('treasure-box-settings') || '{}');
    var theme = (s.state && s.state.theme) || 'dark';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.add(resolved);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`

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
    // suppressHydrationWarning: FOUC 스크립트가 className을 동적으로 바꾸므로 불일치 경고 억제
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background">
        {/* FOUC 방지: body 최상단에서 localStorage 테마를 읽어 html 클래스를 즉시 적용 */}
        <script dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT }} />
        <SettingsBootstrap />
        {children}
      </body>
    </html>
  )
}
